#!/usr/bin/env node

// Test script for the system info collection and n8n workflow
const fetch = require('node:fetch');

const API_ENDPOINT = 'http://localhost:3000/api/update-convex';

async function testWorkflow() {
  console.log('=== TESTING SYSTEM INFO COLLECTION WORKFLOW ===\n');

  // Test 1: First message in a new session (should trigger system info collection)
  console.log('Test 1: First message in session (should collect system info)');
  const sessionId = `test-session-${Date.now()}`;

  try {
    const response1 = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        prompt: 'Hello, this is my first message!',
      }),
    });

    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    console.log('Status:', response1.status);
    console.log('');
  } catch (error) {
    console.error('Test 1 failed:', error.message);
  }

  // Wait a moment before second test
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Second message in same session (should NOT trigger system info collection)
  console.log('Test 2: Second message in same session (should NOT collect system info)');

  try {
    const response2 = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        prompt: 'This is my second message in the same session.',
      }),
    });

    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    console.log('Status:', response2.status);
    console.log('');
  } catch (error) {
    console.error('Test 2 failed:', error.message);
  }

  // Test 3: New session with AI prompt only
  console.log('Test 3: New session with AI prompt only');
  const sessionId2 = `test-session-ai-${Date.now()}`;

  try {
    const response3 = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId2,
        ai_prompt: 'This is an AI-generated prompt for testing.',
      }),
    });

    const result3 = await response3.json();
    console.log('Response:', JSON.stringify(result3, null, 2));
    console.log('Status:', response3.status);
    console.log('');
  } catch (error) {
    console.error('Test 3 failed:', error.message);
  }

  // Test 4: Invalid request (missing session_id)
  console.log('Test 4: Invalid request (missing session_id)');

  try {
    const response4 = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'This should fail because no session_id is provided.',
      }),
    });

    const result4 = await response4.json();
    console.log('Response:', JSON.stringify(result4, null, 2));
    console.log('Status:', response4.status);
    console.log('');
  } catch (error) {
    console.error('Test 4 failed:', error.message);
  }

  console.log('=== WORKFLOW TESTING COMPLETE ===');
}

// Check if we're running this script directly
if (require.main === module) {
  testWorkflow().catch(console.error);
}

module.exports = { testWorkflow };