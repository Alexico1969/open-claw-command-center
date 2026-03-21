const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID;

// Firestore trigger - runs when a new task is created
exports.onNewTask = functions.firestore
  .document('tasks/{taskId}')
  .onCreate(async (snap, context) => {
    const taskData = snap.data();
    const taskTitle = taskData.title || 'Untitled Task';
    const taskId = context.params.taskId;
    
    console.log(`New task created: ${taskTitle} (ID: ${taskId})`);
    
    // Log to Firestore
    await admin.firestore().collection('logs').add({
      message: `[SYSTEM] New task detected: "${taskTitle}"`,
      type: 'system',
      details: `Task ID: ${taskId}, Priority: ${taskData.priority || 'medium'}`,
      timestamp: Date.now(),
      source: 'cloud-function'
    });
    
    // Process task based on keywords
    const lowerTitle = taskTitle.toLowerCase();
    
    // Handle weather tasks
    if (lowerTitle.includes('weather')) {
      await handleWeatherTask(taskId, taskTitle);
    }
    
    // Handle Notion tasks
    if (lowerTitle.includes('notion')) {
      await handleNotionTask(taskId, taskTitle);
    }
    
    // Send notification (webhook) if configured
    const webhookUrl = process.env.TASK_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_task',
            taskId,
            title: taskTitle,
            priority: taskData.priority || 'medium',
            timestamp: new Date().toISOString()
          })
        });
        console.log('Webhook notification sent');
      } catch (err) {
        console.error('Webhook error:', err);
      }
    }
    
    return { success: true };
  });

// Handle weather tasks
async function handleWeatherTask(taskId, title) {
  try {
    // Extract location (default to Freeport, NY)
    let location = 'Freeport, NY';
    const match = title.match(/weather (?:in |for )?(.+?)(?: and|$)/);
    if (match) location = match[1].trim();
    
    // Fetch weather data
    const weatherResponse = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=40.83&longitude=-73.58&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,pressure_msl&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto'
    );
    const weatherData = await weatherResponse.json();
    
    const temp = weatherData.current?.temperature_2m || 'N/A';
    const humidity = weatherData.current?.relative_humidity_2m || 'N/A';
    
    // Send to Notion if configured
    if (NOTION_API_KEY && NOTION_PAGE_ID) {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { page_id: NOTION_PAGE_ID },
          properties: {
            'Name': { title: [{ text: { content: `Weather - ${location}` } }] }
          }
        })
      });
    }
    
    // Update task as completed
    await admin.firestore().collection('tasks').doc(taskId).update({
      completed: true,
      status: 'completed',
      result: `Weather for ${location}: ${temp}°C, ${humidity}% humidity`,
      processedAt: Date.now()
    });
    
    // Log completion
    await admin.firestore().collection('logs').add({
      message: `[SYSTEM] Weather task completed: "${title}"`,
      type: 'success',
      details: `Weather sent to Notion: ${temp}°C, ${humidity}% humidity`,
      timestamp: Date.now(),
      source: 'cloud-function'
    });
    
    console.log(`Weather task ${taskId} processed successfully`);
  } catch (err) {
    console.error('Weather task error:', err);
  }
}

// Handle Notion tasks
async function handleNotionTask(taskId, title) {
  try {
    if (!NOTION_API_KEY || !NOTION_PAGE_ID) {
      console.log('Notion not configured');
      return;
    }
    
    // Extract what to send
    let content = title.replace(/notion/gi, '').replace(/send/gi, '').trim();
    if (!content) content = 'Task update';
    
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { page_id: NOTION_PAGE_ID },
        properties: {
          'Name': { title: [{ text: { content } }] }
        }
      })
    });
    
    // Update task as completed
    await admin.firestore().collection('tasks').doc(taskId).update({
      completed: true,
      status: 'completed',
      result: `Sent to Notion: ${content}`,
      processedAt: Date.now()
    });
    
    // Log completion
    await admin.firestore().collection('logs').add({
      message: `[SYSTEM] Notion task completed: "${title}"`,
      type: 'success',
      details: `Sent to Notion: ${content}`,
      timestamp: Date.now(),
      source: 'cloud-function'
    });
    
    console.log(`Notion task ${taskId} processed successfully`);
  } catch (err) {
    console.error('Notion task error:', err);
  }
}
