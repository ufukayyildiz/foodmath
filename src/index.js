export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path, corsHeaders);
    }

    return serveStatic(path, corsHeaders, env);
  },
};

async function handleAPI(request, env, path, corsHeaders) {
  // Get questions with pagination
  if (path.match(/^\/api\/questions(\?.*)?$/) && request.method === 'GET') {
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page') || '1';
    const page = Math.max(1, parseInt(pageParam) || 1); // Validate: minimum 1
    return handleGetQuestions(env, page, corsHeaders);
  }

  // Create a new question (no category needed)
  if (path === '/api/questions' && request.method === 'POST') {
    return handleCreateQuestion(request, env, corsHeaders);
  }

  if (path.match(/^\/api\/q\/\d+$/) && request.method === 'GET') {
    const questionId = path.split('/').pop();
    return handleGetQuestion(env, questionId, corsHeaders);
  }

  if (path.match(/^\/api\/q\/\d+\/answer$/) && request.method === 'POST') {
    const questionId = path.split('/')[3];
    return handleCreateAnswer(request, env, questionId, corsHeaders);
  }

  if (path.match(/^\/api\/u\/[a-z0-9._]+$/) && request.method === 'GET') {
    const username = path.split('/').pop();
    return handleGetUserProfile(env, username, corsHeaders);
  }

  if (path === '/api/auth/register' && request.method === 'POST') {
    return handleRegister(request, env, corsHeaders);
  }

  if (path === '/api/auth/login' && request.method === 'POST') {
    return handleLogin(request, env, corsHeaders);
  }

  if (path === '/api/auth/logout' && request.method === 'POST') {
    return handleLogout(request, env, corsHeaders);
  }

  if (path === '/api/auth/me' && request.method === 'GET') {
    return handleGetUser(request, env, corsHeaders);
  }

  if (path === '/api/auth/change-password' && request.method === 'POST') {
    return handleChangePassword(request, env, corsHeaders);
  }

  // Public settings endpoint
  if (path === '/api/settings' && request.method === 'GET') {
    return handleGetSettings(env, corsHeaders);
  }

  if (path === '/api/translations' && request.method === 'GET') {
    return handleGetTranslations(env, corsHeaders);
  }

  // Admin API endpoints
  if (path === '/api/admin/settings' && request.method === 'GET') {
    return handleAdminGetSettings(request, env, corsHeaders);
  }

  if (path === '/api/admin/settings' && request.method === 'PUT') {
    return handleAdminUpdateSettings(request, env, corsHeaders);
  }

  if (path === '/api/admin/users' && request.method === 'GET') {
    return handleAdminGetUsers(request, env, corsHeaders);
  }

  if (path === '/api/admin/users' && request.method === 'POST') {
    return handleAdminCreateUser(request, env, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/users\/[^/]+\/role$/) && request.method === 'PUT') {
    const userId = path.split('/')[4];
    return handleAdminUpdateUserRole(request, env, userId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/users\/[^/]+\/ban$/) && request.method === 'PUT') {
    const userId = path.split('/')[4];
    return handleAdminToggleBan(request, env, userId, corsHeaders);
  }

  if (path === '/api/admin/content/questions' && request.method === 'GET') {
    return handleAdminGetQuestions(request, env, corsHeaders);
  }

  if (path === '/api/admin/content/answers' && request.method === 'GET') {
    return handleAdminGetAnswers(request, env, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/questions\/\d+$/) && request.method === 'PUT') {
    const questionId = path.split('/').pop();
    return handleAdminUpdateQuestion(request, env, questionId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/questions\/\d+$/) && request.method === 'DELETE') {
    const questionId = path.split('/').pop();
    return handleAdminDeleteQuestion(request, env, questionId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/questions\/\d+\/author$/) && request.method === 'PUT') {
    const questionId = path.split('/')[4];
    return handleAdminChangeQuestionAuthor(request, env, questionId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/answers\/\d+$/) && request.method === 'GET') {
    const answerId = path.split('/').pop();
    return handleAdminGetAnswer(env, answerId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/answers\/\d+$/) && request.method === 'PUT') {
    const answerId = path.split('/').pop();
    return handleAdminUpdateAnswer(request, env, answerId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/answers\/\d+$/) && request.method === 'DELETE') {
    const answerId = path.split('/').pop();
    return handleAdminDeleteAnswer(request, env, answerId, corsHeaders);
  }

  if (path.match(/^\/api\/admin\/answers\/\d+\/author$/) && request.method === 'PUT') {
    const answerId = path.split('/')[4];
    return handleAdminChangeAnswerAuthor(request, env, answerId, corsHeaders);
  }

  // Voting endpoints
  if (path.match(/^\/api\/questions\/\d+\/vote$/) && request.method === 'POST') {
    const questionId = path.split('/')[3];
    return handleVote(request, env, 'question', questionId, corsHeaders);
  }

  if (path.match(/^\/api\/answers\/\d+\/vote$/) && request.method === 'POST') {
    const answerId = path.split('/')[3];
    return handleVote(request, env, 'answer', answerId, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validateUsername(username) {
  if (!username) return 'Username is required';
  if (username.length > 12) return 'Username must be 12 characters or less';
  if (!/^[a-z0-9.]+$/.test(username)) return 'Username must be lowercase letters, numbers, and dots only';
  return null;
}

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generatePassword() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charsLength = chars.length;
  const maxValid = 256 - (256 % charsLength);
  let password = '';
  
  while (password.length < 8) {
    const randomValues = new Uint8Array(8);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < randomValues.length && password.length < 8; i++) {
      if (randomValues[i] < maxValid) {
        password += chars.charAt(randomValues[i] % charsLength);
      }
    }
  }
  
  return password;
}

async function handleRegister(request, env, corsHeaders) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return new Response(JSON.stringify({ error: 'Email, password, and username required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return new Response(JSON.stringify({ error: usernameError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const existingEmail = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const existingUsername = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUsername) {
      return new Response(JSON.stringify({ error: 'Username already taken' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = await hashPassword(password);

    const insertResult = await env.DB.prepare('INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, ?)').bind(
      email,
      passwordHash,
      username,
      'user'
    ).run();

    const userId = insertResult.meta.last_row_id;

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare('INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)').bind(
      sessionId,
      userId,
      expiresAt
    ).run();

    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
    };

    return new Response(JSON.stringify({ success: true, user: { id: userId, email, username, role: 'user' } }), {
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleLogin(request, env, corsHeaders) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = await env.DB.prepare('SELECT id, email, username, password_hash, role FROM users WHERE email = ?').bind(email).first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare('INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)').bind(
      sessionId,
      user.id,
      expiresAt
    ).run();

    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
    };

    return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email, username: user.username, role: user.role } }), {
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleLogout(request, env, corsHeaders) {
  try {
    const sessionId = getSessionFromCookie(request.headers.get('Cookie'));
    
    if (sessionId) {
      await env.DB.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
    }
    
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    };

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetUser(request, env, corsHeaders) {
  try {
    const sessionId = getSessionFromCookie(request.headers.get('Cookie'));

    if (!sessionId) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await env.DB.prepare(`
      SELECT s.user_id, u.email, u.username, u.role 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.session_id = ? AND s.expires_at > datetime('now')
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      user: {
        id: session.user_id,
        email: session.email,
        username: session.username,
        role: session.role
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function getSessionFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = saltArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return saltHex + ':' + hashHex;
}

async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  
  if (!saltHex || !hashHex) {
    return false;
  }
  
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHashHex === hashHex;
}

async function handleGetQuestions(env, page, corsHeaders) {
  try {
    const perPage = 6;
    const offset = (page - 1) * perPage;

    // Get total count
    const { total } = await env.DB.prepare(`SELECT COUNT(*) as total FROM questions`).first();

    // Get questions with pagination
    const { results: questions } = await env.DB.prepare(`
      SELECT q.id, q.title, q.content, q.created_at, q.votes, u.username,
             (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(perPage, offset).all();

    const totalPages = Math.ceil(total / perPage);

    return new Response(JSON.stringify({ 
      questions,
      page,
      perPage,
      total,
      totalPages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetUserProfile(env, username, corsHeaders) {
  try {
    const user = await env.DB.prepare(`
      SELECT id, username, email, role, created_at FROM users WHERE username = ?
    `).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's questions
    const questions = await env.DB.prepare(`
      SELECT 
        q.id,
        q.title,
        q.votes,
        q.created_at,
        COUNT(DISTINCT a.id) as answer_count
      FROM questions q
      LEFT JOIN answers a ON a.question_id = q.id
      WHERE q.user_id = ?
      GROUP BY q.id, q.title, q.votes, q.created_at
      ORDER BY q.created_at DESC
    `).bind(user.id).all();

    // Get user's answers
    const answers = await env.DB.prepare(`
      SELECT 
        a.id,
        a.content,
        a.votes,
        a.created_at,
        a.question_id,
        q.title as question_title
      FROM answers a
      LEFT JOIN questions q ON q.id = a.question_id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).bind(user.id).all();

    return new Response(JSON.stringify({ 
      user: {
        username: user.username,
        role: user.role,
        created_at: user.created_at
      },
      questions: questions.results || [],
      answers: answers.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetQuestion(env, questionId, corsHeaders) {
  try {
    const question = await env.DB.prepare(`
      SELECT q.id, q.title, q.content, q.created_at, q.votes, u.username
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).bind(questionId).first();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results: answers } = await env.DB.prepare(`
      SELECT a.id, a.content, a.created_at, a.votes, u.username
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ? 
      ORDER BY a.created_at ASC
    `).bind(questionId).all();

    return new Response(JSON.stringify({ question, answers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleCreateQuestion(request, env, corsHeaders) {
  try {
    const sessionId = getSessionFromCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now')
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO questions (title, content, user_id) VALUES (?, ?, ?)
    `).bind(title, content, session.user_id).run();

    const questionId = result.meta.last_row_id;

    return new Response(JSON.stringify({ success: true, questionId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleCreateAnswer(request, env, questionId, corsHeaders) {
  try {
    const sessionId = getSessionFromCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now')
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { content } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const question = await env.DB.prepare('SELECT id FROM questions WHERE id = ?').bind(questionId).first();
    if (!question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO answers (question_id, content, user_id) VALUES (?, ?, ?)
    `).bind(questionId, content, session.user_id).run();

    const answerId = result.meta.last_row_id;

    return new Response(JSON.stringify({ success: true, answerId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleChangePassword(request, env, corsHeaders) {
  try {
    const sessionId = getSessionFromCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await env.DB.prepare(`
      SELECT s.user_id, u.password_hash 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.session_id = ? AND s.expires_at > datetime('now')
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: 'Current and new password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyPassword(currentPassword, session.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(
      newPasswordHash,
      session.user_id
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Admin helper function
async function checkAdminAccess(request, env) {
  const sessionId = getSessionFromCookie(request.headers.get('Cookie'));
  if (!sessionId) return null;

  const session = await env.DB.prepare(`
    SELECT s.user_id, u.role 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.session_id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();

  if (!session || session.role !== 'admin') return null;
  return session;
}

// Admin API handlers
async function handleGetSettings(env, corsHeaders) {
  try {
    const { results: settings } = await env.DB.prepare('SELECT key, value FROM site_settings').all();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });

    return new Response(JSON.stringify(settingsObj), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetTranslations(env, corsHeaders) {
  try {
    const defaultLangResult = await env.DB.prepare('SELECT value FROM site_settings WHERE key = ?').bind('default_language').first();
    const lang = defaultLangResult?.value || 'tr';

    const { results: translations } = await env.DB.prepare('SELECT key, value FROM translations WHERE lang = ?').bind(lang).all();
    const translationsObj = {};
    translations.forEach(t => { translationsObj[t.key] = t.value; });

    return new Response(JSON.stringify({ lang, translations: translationsObj }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminGetSettings(request, env, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results: settings } = await env.DB.prepare('SELECT key, value FROM site_settings').all();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });

    return new Response(JSON.stringify(settingsObj), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminUpdateSettings(request, env, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { site_title, site_tagline, default_language } = await request.json();

    // Use D1 batch for multiple writes (required for production)
    const statements = [];
    
    if (site_title) {
      statements.push(
        env.DB.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
          .bind('site_title', site_title)
      );
    }
    if (site_tagline) {
      statements.push(
        env.DB.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
          .bind('site_tagline', site_tagline)
      );
    }
    if (default_language && (default_language === 'en' || default_language === 'tr')) {
      statements.push(
        env.DB.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
          .bind('default_language', default_language)
      );
    }

    // Execute all updates in a single batch operation
    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminGetUsers(request, env, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results: users } = await env.DB.prepare(`
      SELECT id, email, username, role, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminUpdateUserRole(request, env, userId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { role } = await request.json();
    if (!role || !['user', 'admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, userId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminToggleBan(request, env, userId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { banned } = await request.json();
    await env.DB.prepare('UPDATE users SET banned = ? WHERE id = ?').bind(banned ? 1 : 0, userId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminGetQuestions(request, env, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results: questions } = await env.DB.prepare(`
      SELECT q.id, q.title, q.content, q.created_at, q.votes, u.username
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminGetAnswers(request, env, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results: answers } = await env.DB.prepare(`
      SELECT a.id, a.content, a.created_at, a.votes, u.username, q.title as question_title
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      JOIN questions q ON a.question_id = q.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({ answers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminUpdateQuestion(request, env, questionId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, content } = await request.json();
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare('UPDATE questions SET title = ?, content = ? WHERE id = ?').bind(title, content, questionId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminDeleteQuestion(request, env, questionId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete votes for all answers to this question first
    await env.DB.prepare(`
      DELETE FROM votes 
      WHERE item_type = 'answer' 
      AND item_id IN (SELECT id FROM answers WHERE question_id = ?)
    `).bind(questionId).run();

    // Delete votes for the question
    await env.DB.prepare(`
      DELETE FROM votes 
      WHERE item_type = 'question' AND item_id = ?
    `).bind(questionId).run();

    // Delete all answers for this question
    await env.DB.prepare('DELETE FROM answers WHERE question_id = ?').bind(questionId).run();

    // Finally delete the question
    await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(questionId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminGetAnswer(env, answerId, corsHeaders) {
  try {
    const answer = await env.DB.prepare(`
      SELECT id, content, question_id, user_id, created_at
      FROM answers 
      WHERE id = ?
    `).bind(answerId).first();

    if (!answer) {
      return new Response(JSON.stringify({ error: 'Answer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminUpdateAnswer(request, env, answerId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { content } = await request.json();
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare('UPDATE answers SET content = ? WHERE id = ?').bind(content, answerId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminDeleteAnswer(request, env, answerId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete votes for this answer first
    await env.DB.prepare(`
      DELETE FROM votes 
      WHERE item_type = 'answer' AND item_id = ?
    `).bind(answerId).run();

    // Then delete the answer
    await env.DB.prepare('DELETE FROM answers WHERE id = ?').bind(answerId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminCreateUser(request, env, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, username, name, role } = await request.json();
    
    if (!email || !username) {
      return new Response(JSON.stringify({ error: 'Email and username are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return new Response(JSON.stringify({ error: usernameError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRole = role && ['user', 'admin'].includes(role) ? role : 'user';

    // Check if username or email already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .bind(username, email)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-generate 8-character password
    const password = generatePassword();
    const passwordHash = await hashPassword(password);
    
    await env.DB.prepare(
      'INSERT INTO users (email, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, username, passwordHash, userRole, name || null).run();

    return new Response(JSON.stringify({ success: true, password }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminChangeQuestionAuthor(request, env, questionId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { username } = await request.json();
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from username
    const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update question author
    await env.DB.prepare('UPDATE questions SET user_id = ? WHERE id = ?').bind(user.id, questionId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAdminChangeAnswerAuthor(request, env, answerId, corsHeaders) {
  try {
    const admin = await checkAdminAccess(request, env);
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { username } = await request.json();
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from username
    const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update answer author
    await env.DB.prepare('UPDATE answers SET user_id = ? WHERE id = ?').bind(user.id, answerId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleVote(request, env, itemType, itemId, corsHeaders) {
  try {
    const sessionId = getSessionFromCookie(request.headers.get('Cookie'));
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await env.DB.prepare(`
      SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > datetime('now')
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user_id;

    const { vote } = await request.json();
    if (vote !== 1 && vote !== -1 && vote !== 0) {
      return new Response(JSON.stringify({ error: 'Vote must be 1 (upvote), -1 (downvote), or 0 (remove)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tableName = itemType === 'question' ? 'questions' : 'answers';

    // Check existing vote
    const existingVote = await env.DB.prepare('SELECT vote FROM votes WHERE user_id = ? AND item_type = ? AND item_id = ?')
      .bind(userId, itemType, itemId)
      .first();

    if (vote === 0) {
      // Remove vote
      if (existingVote) {
        await env.DB.prepare('DELETE FROM votes WHERE user_id = ? AND item_type = ? AND item_id = ?')
          .bind(userId, itemType, itemId)
          .run();
        await env.DB.prepare(`UPDATE ${tableName} SET votes = votes - ? WHERE id = ?`)
          .bind(existingVote.vote, itemId)
          .run();
      }
    } else if (existingVote) {
      // Update existing vote
      const voteDiff = vote - existingVote.vote;
      await env.DB.prepare('UPDATE votes SET vote = ? WHERE user_id = ? AND item_type = ? AND item_id = ?')
        .bind(vote, userId, itemType, itemId)
        .run();
      await env.DB.prepare(`UPDATE ${tableName} SET votes = votes + ? WHERE id = ?`)
        .bind(voteDiff, itemId)
        .run();
    } else {
      // Create new vote
      await env.DB.prepare('INSERT INTO votes (user_id, item_type, item_id, vote) VALUES (?, ?, ?, ?)')
        .bind(userId, itemType, itemId, vote)
        .run();
      await env.DB.prepare(`UPDATE ${tableName} SET votes = votes + ? WHERE id = ?`)
        .bind(vote, itemId)
        .run();
    }

    // Get updated votes count
    const item = await env.DB.prepare(`SELECT votes FROM ${tableName} WHERE id = ?`).bind(itemId).first();

    return new Response(JSON.stringify({ success: true, votes: item.votes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleSitemap(env, corsHeaders) {
  try {
    const settingsResult = await env.DB.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    settingsResult.results.forEach(row => {
      settings[row.key] = row.value;
    });
    
    const baseUrl = settings.site_url || 'https://foodmath.net';
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/q-sitemap.xml</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response('Error generating sitemap', { status: 500 });
  }
}

async function handleQuestionSitemap(env, corsHeaders) {
  try {
    const settingsResult = await env.DB.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    settingsResult.results.forEach(row => {
      settings[row.key] = row.value;
    });
    
    const baseUrl = settings.site_url || 'https://foodmath.net';
    
    const questionsResult = await env.DB.prepare(`
      SELECT id, created_at
      FROM questions
      ORDER BY created_at DESC
    `).all();

    let urlEntries = '';
    for (const question of questionsResult.results) {
      const lastmod = new Date(question.created_at).toISOString().split('T')[0];
      urlEntries += `
  <url>
    <loc>${baseUrl}/q/${question.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response('Error generating question sitemap', { status: 500 });
  }
}

function handleRobotsTxt(env, corsHeaders) {
  const robots = `User-agent: *
Allow: /

Sitemap: https://foodmath.net/sitemap.xml
Sitemap: https://foodmath.net/q-sitemap.xml`;

  return new Response(robots, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}

async function serveStatic(path, corsHeaders, env) {
  // Server-Side Rendering for key pages
  if (path === '/') {
    return await renderHomePage(env, 1, corsHeaders);
  }

  // Pagination routes /p/1, /p/2, etc.
  if (path.match(/^\/p\/\d+$/)) {
    const page = parseInt(path.split('/').pop());
    return await renderHomePage(env, page, corsHeaders);
  }

  if (path.match(/^\/q\/\d+$/)) {
    const questionId = path.split('/').pop();
    return await renderQuestionPage(env, questionId, corsHeaders);
  }

  // Static pages with real site settings
  if (path === '/login' || path === '/register' || path === '/admin' || path === '/profile' || path.startsWith('/u/')) {
    try {
      const settingsResult = await env.DB.prepare('SELECT key, value FROM site_settings').all();
      const settings = {};
      settingsResult.results.forEach(row => {
        settings[row.key] = row.value;
      });
      
      const siteTitle = settings.site_title || 'Q&A Platform';
      const siteTagline = settings.site_tagline || 'Ask questions, get answers';
      const lang = settings.default_language || 'tr';
      
      return new Response(getBaseHTML(siteTitle, siteTagline, siteTitle, siteTagline, lang), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    } catch (error) {
      return new Response(getBaseHTML('Q&A Platform', 'Ask questions, get answers', 'Q&A Platform', 'Ask questions, get answers', 'tr'), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }
  }

  // Sitemap endpoints
  if (path === '/sitemap.xml') {
    return await handleSitemap(env, corsHeaders);
  }

  if (path === '/q-sitemap.xml') {
    return await handleQuestionSitemap(env, corsHeaders);
  }

  // Robots.txt
  if (path === '/robots.txt') {
    return handleRobotsTxt(env, corsHeaders);
  }

  if (path === '/styles.css' || path.startsWith('/styles.css?')) {
    return new Response(CSS, {
      headers: { ...corsHeaders, 'Content-Type': 'text/css', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  }

  if (path === '/app.js' || path.startsWith('/app.js?')) {
    return new Response(JS, {
      headers: { ...corsHeaders, 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  }

  return new Response('Not Found', { status: 404 });
}

async function renderHomePage(env, page, corsHeaders) {
  try {
    const perPage = 6;
    const offset = (page - 1) * perPage;

    // Fetch site settings, questions, and translations
    const [settingsResult, totalResult, questionsResult, translationsResult] = await Promise.all([
      env.DB.prepare('SELECT key, value FROM site_settings').all(),
      env.DB.prepare('SELECT COUNT(*) as total FROM questions').first(),
      env.DB.prepare(`
        SELECT q.id, q.title, q.content, q.created_at, q.votes, u.username,
               (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
        FROM questions q
        LEFT JOIN users u ON q.user_id = u.id
        ORDER BY q.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(perPage, offset).all(),
      env.DB.prepare('SELECT key, value, lang FROM translations').all()
    ]);

    const settings = {};
    settingsResult.results.forEach(row => {
      settings[row.key] = row.value;
    });

    const siteTitle = settings.site_title || 'Q&A Platform';
    const siteTagline = settings.site_tagline || 'Ask questions, get answers';
    const lang = settings.default_language || 'tr';
    const questions = questionsResult.results || [];
    const total = totalResult.total || 0;
    const totalPages = Math.ceil(total / perPage);

    // Build translations object for current language
    const translations = {};
    translationsResult.results.forEach(row => {
      if (row.lang === lang) {
        translations[row.key] = row.value;
      }
    });

    const description = `${siteTitle} - ${siteTagline}. ${total} ${translations['home.total_questions'] || 'questions'}.`;
    
    // Render questions HTML
    let questionsHTML = '';
    if (questions.length === 0) {
      questionsHTML = `<div class="no-questions">${translations['home.no_questions'] || 'No questions yet. Be the first to ask!'}</div>`;
    } else {
      questions.forEach(q => {
        const answerText = q.answer_count === 1 
          ? (translations['misc.answer_singular'] || 'answer')
          : (translations['misc.answer_plural'] || 'answers');
        
        questionsHTML += `
          <div class="question-card" data-question-id="${q.id}">
            <div class="question-card-inner">
              <div class="vote-section">
                <button class="vote-btn upvote" data-id="${q.id}" data-type="question">▲</button>
                <span class="vote-count" id="question-${q.id}-votes">${q.votes || 0}</span>
                <button class="vote-btn downvote" data-id="${q.id}" data-type="question">▼</button>
              </div>
              <div class="question-card-content">
                <h3 class="question-card-title">${escapeHtml(q.title)}</h3>
                <p class="question-card-excerpt">${escapeHtml(q.content.substring(0, 200))}${q.content.length > 200 ? '...' : ''}</p>
                <div class="question-card-meta">
                  <span>${q.answer_count} ${answerText}</span>
                  ${q.username ? `<span>•</span><span>${translations['misc.asked_by'] || 'asked by'} <a href="/u/${escapeHtml(q.username)}">@${escapeHtml(q.username)}</a></span>` : ''}
                  <span>•</span>
                  <span>${new Date(q.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                </div>
              </div>
            </div>
          </div>`;
      });
    }

    // Pagination HTML
    let paginationHTML = '';
    if (totalPages > 1) {
      paginationHTML = '<div class="pagination">';
      
      if (page > 1) {
        const prevPage = page === 2 ? '/' : `/p/${page - 1}`;
        paginationHTML += `<a href="${prevPage}" class="pagination-btn">← ${translations['pagination.previous'] || 'Previous'}</a>`;
      }
      
      // Show limited page numbers (max 7 buttons)
      const maxButtons = 7;
      let startPage = Math.max(1, page - 3);
      let endPage = Math.min(totalPages, page + 3);
      
      // Adjust if near the beginning
      if (page <= 4) {
        endPage = Math.min(maxButtons, totalPages);
      }
      
      // Adjust if near the end
      if (page >= totalPages - 3) {
        startPage = Math.max(1, totalPages - maxButtons + 1);
      }
      
      // First page + ellipsis
      if (startPage > 1) {
        paginationHTML += `<a href="/" class="pagination-btn">1</a>`;
        if (startPage > 2) {
          paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
      }
      
      // Page numbers
      for (let i = startPage; i <= endPage; i++) {
        const pageUrl = i === 1 ? '/' : `/p/${i}`;
        const isActive = i === page;
        paginationHTML += `<a href="${pageUrl}" class="pagination-btn ${isActive ? 'active' : ''}">${i}</a>`;
      }
      
      // Ellipsis + last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<a href="/p/${totalPages}" class="pagination-btn">${totalPages}</a>`;
      }
      
      if (page < totalPages) {
        paginationHTML += `<a href="/p/${page + 1}" class="pagination-btn">${translations['pagination.next'] || 'Next'} →</a>`;
      }
      
      paginationHTML += '</div>';
    }

    const bodyContent = `
      <div class="questions-container">
        <div class="questions-header">
          <h2>${translations['home.all_questions']} (${total})</h2>
          <button id="askQuestionBtn" class="btn-primary">
            ${translations['button.ask_question']}
          </button>
        </div>
        <div class="questions-list">
          ${questionsHTML}
        </div>
        ${paginationHTML}
      </div>`;
    
    const html = getBaseHTML(siteTitle, description, siteTitle, siteTagline, lang, bodyContent, translations);
    
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
    return new Response(getBaseHTML('Q&A Platform', 'Ask questions, get answers', 'Q&A Platform', 'Ask questions, get answers', 'tr'), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
}

async function renderQuestionPage(env, questionId, corsHeaders) {
  try {
    const [settingsResult, questionResult, answersResult, translationsResult] = await Promise.all([
      env.DB.prepare('SELECT key, value FROM site_settings').all(),
      env.DB.prepare(`
        SELECT q.*, u.username, u.role
        FROM questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id = ?
      `).bind(questionId).first(),
      env.DB.prepare(`
        SELECT a.*, u.username, u.role
        FROM answers a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.question_id = ?
        ORDER BY a.created_at ASC
      `).bind(questionId).all(),
      env.DB.prepare('SELECT key, value, lang FROM translations').all()
    ]);

    const settings = {};
    settingsResult.results.forEach(row => {
      settings[row.key] = row.value;
    });

    const siteTitle = settings.site_title || 'Q&A Platform';
    const siteTagline = settings.site_tagline || 'Ask questions, get answers';
    const lang = settings.default_language || 'tr';
    const baseUrl = settings.site_url || 'https://foodmath.net';
    const question = questionResult;
    const answers = answersResult.results || [];

    // Build translations
    const translations = {};
    translationsResult.results.forEach(row => {
      if (row.lang === lang) {
        translations[row.key] = row.value;
      }
    });

    if (!question) {
      const notFoundContent = `
        <div style="text-align: center; padding: 80px 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="font-size: 72px; margin: 0; color: #d1242f;">404</h1>
          <h2 style="font-size: 28px; margin: 16px 0; color: #24292f;">${translations['error.question_not_found'] || 'Question Not Found'}</h2>
          <p style="font-size: 16px; color: #57606a; margin-bottom: 32px;">
            ${translations['error.question_deleted'] || 'This question may have been deleted or does not exist.'}
          </p>
          <a href="/" class="btn-primary" style="display: inline-block; padding: 12px 24px; background: #28a745; color: #fff; text-decoration: none; font-weight: 600; border-radius: 6px;">
            ${translations['button.back_home'] || 'Back to Home'}
          </a>
        </div>
      `;
      return new Response(getBaseHTML('404 - Question Not Found', 'The question you are looking for does not exist.', siteTitle, siteTagline, lang, notFoundContent, translations), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    const title = `${question.title} - ${siteTitle}`;
    const description = question.content.substring(0, 155) + (question.content.length > 155 ? '...' : '');
    
    // Render answers HTML
    let answersHTML = '';
    if (answers.length === 0) {
      answersHTML = `<div class="no-answers">${translations['question.no_answers'] || 'No answers yet. Be the first to answer!'}</div>`;
    } else {
      answersHTML = '<div class="answers-list">';
      answers.forEach(a => {
        answersHTML += `
          <div class="answer-detail" id="a-${a.id}" data-id="${a.id}" data-type="answer">
            <div class="vote-section">
              <button class="vote-btn upvote" data-id="${a.id}" data-type="answer">▲</button>
              <span class="vote-count" id="a-${a.id}-votes">${a.votes || 0}</span>
              <button class="vote-btn downvote" data-id="${a.id}" data-type="answer">▼</button>
            </div>
            <div class="content-body">
              <div class="answer-content">${formatTextWithParagraphs(a.content)}</div>
              <div class="answer-meta">
                ${a.username ? `<a href="/u/${escapeHtml(a.username)}">@${escapeHtml(a.username)}</a>` : '<span>' + (translations['misc.anonymous'] || 'Anonim') + '</span>'}
                <span>•</span>
                <span>${new Date(a.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
              </div>
            </div>
          </div>`;
      });
      answersHTML += '</div>';
    }

    const bodyContent = `
      <div class="breadcrumb">
        <a href="/">${translations['breadcrumb.home'] || 'Home'}</a> &gt; 
        ${escapeHtml(question.title)}
      </div>
      <div class="question-detail" data-id="${question.id}" data-type="question">
        <div class="vote-section">
          <button class="vote-btn upvote" data-id="${question.id}" data-type="question">▲</button>
          <span class="vote-count" id="question-${question.id}-votes">${question.votes || 0}</span>
          <button class="vote-btn downvote" data-id="${question.id}" data-type="question">▼</button>
        </div>
        <div class="content-body">
          <h1>${escapeHtml(question.title)}</h1>
          <div class="question-content">${formatTextWithParagraphs(question.content)}</div>
          <div class="answer-meta">
            ${question.username ? `<span>${translations['user.asked_by'] || ''} <a href="/u/${escapeHtml(question.username)}">@${escapeHtml(question.username)}</a></span>` : '<span>' + (translations['misc.anonymous'] || 'Anonim') + '</span>'}
            <span>•</span>
            <span>${new Date(question.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
          </div>
        </div>
      </div>
      <div class="answers-section">
        <div class="answers-header">
          <h2>${translations['question.answers'] || 'Answers'} (${answers.length})</h2>
          ${answers.length > 0 ? `
            <span class="answer-meta-inline">
              ${answers[0].username ? `${translations['user.asked_by'] || ''} <a href="/u/${escapeHtml(answers[0].username)}">@${escapeHtml(answers[0].username)}</a>` : translations['misc.anonymous'] || 'Anonim'}
              <span>•</span>
              <span>${new Date(answers[0].created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
            </span>
          ` : ''}
        </div>
        ${answersHTML}
      </div>
      <div id="answerFormPlaceholder"></div>`;
    
    // Generate QAPage structured data for SEO
    const structuredData = generateQAPageStructuredData(question, answers, baseUrl);
    
    return new Response(getBaseHTML(title, description, siteTitle, siteTagline, lang, bodyContent, translations, structuredData), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return new Response(getBaseHTML('Q&A Platform', 'Ask questions, get answers', 'Q&A Platform', 'Ask questions, get answers', 'tr'), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
}

function getBaseHTML(pageTitle, description, siteTitle, siteTagline, lang = 'tr', bodyContent = '', translations = {}, structuredData = null) {
  const loginText = translations['nav.login'] || 'Login';
  const signupText = translations['nav.signup'] || 'Sign Up';
  
  const structuredDataScript = structuredData ? `
  <script type="application/ld+json">
${structuredData}
  </script>` : '';
  
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${structuredDataScript}
  <link rel="preload" href="/styles.css?v=9" as="style">
  <link rel="stylesheet" href="/styles.css?v=9">
  <link rel="preload" href="/app.js?v=9" as="script">
</head>
<body>
  <div class="container">
    <header>
      <div class="header-content">
        <div>
          <a href="/" class="header-link">
            <div class="site-title" id="siteTitle">${escapeHtml(siteTitle)}</div>
          </a>
          <p class="subtitle" id="siteTagline">${escapeHtml(siteTagline)}</p>
        </div>
        <button class="mobile-menu-btn" id="mobileMenuBtn" onclick="toggleMobileMenu()">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="user-nav" id="userNav">
          <a href="/login" class="btn-secondary">${escapeHtml(loginText)}</a>
          <a href="/register" class="btn-primary">${escapeHtml(signupText)}</a>
        </nav>
      </div>
    </header>
    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-menu-overlay" onclick="toggleMobileMenu()"></div>
      <div class="mobile-menu-content">
        <button class="mobile-menu-close" onclick="toggleMobileMenu()">✕</button>
        <nav class="mobile-nav" id="mobileNav">
          <a href="/login" class="btn-secondary" onclick="toggleMobileMenu()">${escapeHtml(loginText)}</a>
          <a href="/register" class="btn-primary" onclick="toggleMobileMenu()">${escapeHtml(signupText)}</a>
        </nav>
      </div>
    </div>
    <main id="app">${bodyContent || '<div class="loading">Loading...</div>'}</main>
  </div>
  <script>
    function toggleMobileMenu() {
      const menu = document.getElementById('mobileMenu');
      menu.classList.toggle('active');
    }
  </script>
  <script defer src="/app.js?v=9"></script>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatTextWithParagraphs(text) {
  if (!text) return '';
  
  // Extract existing iframes (like YouTube embeds) before escaping
  const iframes = [];
  let processedText = text.replace(/<iframe[^>]*>.*?<\/iframe>/gi, (match) => {
    const placeholder = `___IFRAME_${iframes.length}___`;
    iframes.push(match);
    return placeholder;
  });
  
  // Parse quote blocks first (before escaping) - match author up to first comma
  const quoteRegex = /\[quote="([^,]+),\s*post:(\d+),\s*topic:(\d+)"\]([\s\S]*?)\[\/quote\]/g;
  
  // Replace quote blocks with placeholders
  const quotes = [];
  processedText = processedText.replace(quoteRegex, (match, author, postNum, topicId, content) => {
    const placeholder = `___QUOTE_${quotes.length}___`;
    quotes.push({
      author: escapeHtml(author),
      postNum,
      topicId,
      content: escapeHtml(content.trim())
    });
    return placeholder;
  });
  
  // Escape the remaining text
  const escaped = escapeHtml(processedText);
  
  // Convert YouTube URLs to embeds (before general link conversion)
  // Match: youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID, youtube.com/embed/VIDEO_ID
  const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const withYouTube = escaped.replace(youtubeRegex, (match, videoId) => {
    return `<div class="video-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  });
  
  // Convert remaining URLs to clickable links (after YouTube conversion)
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const linkedText = withYouTube.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Process paragraphs
  const paragraphs = linkedText.split(/\n\n+/);
  let formatted = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p style="margin-bottom: 12px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  
  // Replace placeholders with styled quote blocks
  quotes.forEach((quote, index) => {
    const quoteHtml = `<blockquote class="quote-block">
      <div class="quote-header">
        <a href="/u/${quote.author.toLowerCase()}">@${quote.author}</a> said in <a href="/q/${quote.topicId}">question #${quote.topicId}</a>:
      </div>
      <div class="quote-content">${quote.content.replace(/\n/g, '<br>')}</div>
    </blockquote>`;
    formatted = formatted.replace(`___QUOTE_${index}___`, quoteHtml);
  });
  
  // Restore extracted iframes
  iframes.forEach((iframe, index) => {
    formatted = formatted.replace(`___IFRAME_${index}___`, iframe);
  });
  
  return formatted || `<p>${escaped}</p>`;
}

function generateQAPageStructuredData(question, answers, baseUrl) {
  // Clean text for JSON (remove HTML tags and escape quotes)
  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/"/g, '\\"') // Escape quotes
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Convert database datetime to ISO 8601 with timezone
  const toISO8601 = (dateStr) => {
    if (!dateStr) return '';
    // Database format: "2025-11-09 00:20:50"
    // ISO 8601 format: "2025-11-09T00:20:50Z"
    return dateStr.replace(' ', 'T') + 'Z';
  };

  const questionUrl = `${baseUrl}/q/${question.id}`;
  
  // Build author object for question
  const questionAuthor = question.username ? {
    "@type": "Person",
    "name": question.username,
    "url": `${baseUrl}/u/${question.username}`
  } : {
    "@type": "Person",
    "name": "Anonymous"
  };

  // Sort answers by votes to find best answer
  const sortedAnswers = [...answers].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  
  // Build acceptedAnswer (highest voted answer if exists)
  let acceptedAnswer = null;
  let suggestedAnswers = [];
  
  if (sortedAnswers.length > 0) {
    const bestAnswer = sortedAnswers[0];
    acceptedAnswer = {
      "@type": "Answer",
      "text": cleanText(bestAnswer.content),
      "upvoteCount": bestAnswer.votes || 0,
      "url": `${questionUrl}#a-${bestAnswer.id}`,
      "datePublished": toISO8601(bestAnswer.created_at),
      "author": bestAnswer.username ? {
        "@type": "Person",
        "name": bestAnswer.username,
        "url": `${baseUrl}/u/${bestAnswer.username}`
      } : {
        "@type": "Person",
        "name": "Anonymous"
      }
    };
    
    // All other answers are suggested answers
    suggestedAnswers = sortedAnswers.slice(1).map(answer => ({
      "@type": "Answer",
      "text": cleanText(answer.content),
      "upvoteCount": answer.votes || 0,
      "url": `${questionUrl}#a-${answer.id}`,
      "datePublished": toISO8601(answer.created_at),
      "author": answer.username ? {
        "@type": "Person",
        "name": answer.username,
        "url": `${baseUrl}/u/${answer.username}`
      } : {
        "@type": "Person",
        "name": "Anonymous"
      }
    }));
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": cleanText(question.title),
      "text": cleanText(question.content),
      "answerCount": answers.length,
      "upvoteCount": question.votes || 0,
      "datePublished": toISO8601(question.created_at),
      "author": questionAuthor
    }
  };

  // Add acceptedAnswer if exists
  if (acceptedAnswer) {
    structuredData.mainEntity.acceptedAnswer = acceptedAnswer;
  }

  // Add suggestedAnswer array if exists
  if (suggestedAnswers.length > 0) {
    structuredData.mainEntity.suggestedAnswer = suggestedAnswers;
  }

  return JSON.stringify(structuredData, null, 2);
}

// HTML now generated dynamically via getBaseHTML() for SSR

const CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #e3f2fd; color: #24292f; font-size: 14px; line-height: 1.6; }
p, span, div, li, td, th, label { color: #24292f; }
header { background: #fff; border-bottom: 1px solid #d0d7de; padding: 16px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width: 100%; }
.header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1600px; margin: 0 auto; padding: 0 32px; }
.header-link { text-decoration: none !important; color: inherit !important; }
h1 { font-size: 24px; font-weight: 600; margin: 0; color: #0969da; }
.site-title { font-size: 24px; font-weight: 600; margin: 0; color: #24292f; }
.subtitle { color: #57606a; font-size: 14px; margin-top: 4px; }
.user-nav { display: flex; gap: 12px; align-items: center; }
.mobile-menu-btn { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 8px; }
.mobile-menu-btn span { display: block; width: 24px; height: 3px; background: #24292f; transition: all 0.3s; }
.mobile-menu { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000; pointer-events: none; }
.mobile-menu.active { pointer-events: auto; }
.mobile-menu-overlay { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0, 0, 0, 0); transition: background 0.3s; }
.mobile-menu.active .mobile-menu-overlay { background: rgba(0, 0, 0, 0.5); }
.mobile-menu-content { position: absolute; top: 0; right: -300px; bottom: 0; width: 300px; max-width: 80vw; background: #fff; box-shadow: -2px 0 8px rgba(0,0,0,0.1); transition: right 0.3s; padding: 60px 24px 24px 24px; }
.mobile-menu.active .mobile-menu-content { right: 0; }
.mobile-menu-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 32px; cursor: pointer; color: #24292f; padding: 8px; line-height: 1; }
.mobile-nav { display: flex; flex-direction: column; gap: 16px; }
.btn-primary, .btn-secondary, .btn-logout { padding: 8px 16px; border: 1px solid #d0d7de; background: #fff; color: #24292f; text-decoration: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
.btn-primary { background: #218838; border-color: #218838; color: #fff; }
.btn-primary:hover { background: #1e7e34; }
.btn-secondary { background: #fff; color: #24292f; border-color: #d0d7de; }
.btn-secondary:hover { background: #f6f8fa; border-color: #0969da; }
.btn-logout { background: transparent; border-color: #d1242f; color: #d1242f; }
.btn-logout:hover { background: #d1242f; color: #fff; }
.user-info { color: #24292f; font-size: 14px; font-weight: 500; }
#app { background: #e3f2fd; padding: 24px 32px; min-height: 70vh; width: 70%; margin: 0 auto; }
.breadcrumb { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #d0d7de; color: #57606a; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.breadcrumb a { color: #0969da; text-decoration: none; font-weight: 500; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb span { margin: 0 6px; color: #d0d7de; }
.question-list { display: flex; flex-direction: column; gap: 0; }
.question-card { background: #fff; border: 1px solid #d0d7de; padding: 20px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; display: flex; gap: 16px; }
.question-card:hover { border-color: #0969da; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.question-title { font-size: 18px; font-weight: 600; color: #0969da; margin-bottom: 8px; }
.question-title:hover { color: #0550ae; }
.question-content { color: #24292f; font-size: 14px; margin-bottom: 8px; line-height: 1.5; }
.question-meta { color: #57606a; font-size: 12px; display: flex; gap: 12px; align-items: center; }
.question-meta a { color: #24292f; text-decoration: none; font-weight: 500; }
.question-meta a:hover { color: #0969da; }
.question-detail { background: #fffef0; border: 1px solid #d0d7de; padding: 32px; margin-bottom: 16px; display: flex; gap: 16px; position: relative; }
.question-detail h2 { font-size: 28px; font-weight: 600; color: #24292f; margin-bottom: 16px; }
.question-detail p { color: #24292f; line-height: 1.6; font-size: 16px; }
.content-body { flex: 1; }
.answers-section { background: #e3f2fd; padding: 24px 0; }
.answers-header { margin-bottom: 24px; }
.answers-header h2 { font-size: 20px; font-weight: 600; color: #24292f; margin: 0; }
.answer-meta-inline { color: #57606a; font-size: 12px; display: none; }
.answer-meta-inline a { color: #24292f; text-decoration: none; font-weight: 500; }
.answer-meta-inline a:hover { text-decoration: underline; }
.answers-title { font-size: 20px; font-weight: 600; color: #24292f; margin-bottom: 24px; }
.answers-list { display: flex; flex-direction: column; gap: 16px; }
.answer-detail { background: #f0fff4 !important; border: 1px solid #d0d7de !important; padding: 24px !important; padding-left: 34px !important; display: flex !important; gap: 16px !important; margin-bottom: 16px !important; position: relative !important; }
.answer-content { color: #24292f !important; line-height: 1.6; margin-bottom: 12px; font-size: 15px; }
.quote-block { margin: 16px 0; padding: 12px 16px; background: #f6f8fa; border-left: 4px solid #0969da; border-radius: 4px; }
.quote-header { font-size: 13px; color: #57606a; margin-bottom: 8px; font-weight: 500; }
.quote-header a { color: #0969da; text-decoration: none; }
.quote-header a:hover { text-decoration: underline; }
.quote-content { color: #24292f; font-size: 14px; line-height: 1.5; font-style: italic; }
.video-embed { margin: 16px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; }
.video-embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
.answer-meta { color: #57606a !important; font-size: 12px; display: flex; gap: 12px; align-items: center; }
.answer-meta span { color: #57606a !important; }
.answer-meta a { color: #24292f !important; }
.answer-meta a { color: #24292f; text-decoration: none; font-weight: 500; }
.answer-meta a:hover { color: #0969da; }
.no-answers, .no-questions { text-align: center; padding: 60px 20px; color: #57606a; background: #fff; border: 1px dashed #d0d7de; }
.auth-form { max-width: 800px; margin: 40px auto; background: #fff; border: 1px solid #d0d7de; padding: 32px; }
.auth-form h2 { font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #24292f; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #24292f; }
.form-group input, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #d0d7de; background: #fff; color: #24292f; font-size: 14px; font-family: inherit; transition: border 0.2s; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #0969da; }
.form-group textarea { resize: vertical; min-height: 120px; }
.submit-btn { padding: 10px 20px; background: #218838; color: #fff; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s; }
.submit-btn:hover { background: #1e7e34; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-message { background: #d1242f; color: #fff; padding: 12px 16px; margin-bottom: 16px; border: 1px solid #a50e0e; }
.success-message { background: #218838; color: #fff; padding: 12px 16px; margin-bottom: 16px; border: 1px solid #1e7e34; }
.auth-link { margin-top: 20px; font-size: 14px; color: #57606a; }
.auth-link a { color: #0969da; text-decoration: none; }
.auth-link a:hover { text-decoration: underline; }
.admin-panel { background: #fff; border: 1px solid #d0d7de; padding: 32px; }
.admin-panel h2 { font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #24292f; }
.admin-panel h3 { font-size: 18px; font-weight: 600; margin: 32px 0 16px 0; padding-top: 24px; border-top: 1px solid #d0d7de; color: #24292f; }
.admin-panel table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #fff; }
.admin-panel th { background: #f6f8fa; padding: 12px; text-align: left; border: 1px solid #d0d7de; font-weight: 600; font-size: 13px; color: #24292f; }
.admin-panel td { padding: 12px; border: 1px solid #d0d7de; font-size: 14px; color: #24292f; }
.admin-panel tr:hover { background: #f6f8fa; }
.admin-panel input[type="text"], .admin-panel input[type="email"], .admin-panel select { padding: 8px 12px; border: 1px solid #d0d7de; font-size: 14px; width: 100%; max-width: 300px; }
.admin-panel input[type="text"]:focus, .admin-panel input[type="email"]:focus, .admin-panel select:focus { outline: none; border-color: #0969da; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(1, 4, 9, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal { background: #fff; border: 1px solid #d0d7de; padding: 32px; min-width: 560px; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 16px 64px rgba(31, 35, 40, 0.3); }
.modal h3 { font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #24292f; }
.modal .form-group { margin-bottom: 16px; }
.modal .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #24292f; }
.modal .form-group input, .modal .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #d0d7de; background: #fff; color: #24292f; font-size: 14px; font-family: inherit; transition: border 0.2s; }
.modal .form-group input:focus, .modal .form-group textarea:focus { outline: none; border-color: #0969da; }
.modal .form-group textarea { resize: vertical; min-height: 120px; }
.modal-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }
.admin-btn { padding: 10px 20px; background: #218838; color: #fff; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s; }
.admin-btn:hover { background: #1e7e34; }
.admin-btn.secondary { background: #f6f8fa; border: 1px solid #d0d7de; color: #24292f; }
.admin-btn.secondary:hover { background: #eaeef2; }
.vote-buttons { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 48px; }
.vote-section { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 8px !important; min-width: 48px !important; }
.vote-btn { background: #f6f8fa !important; border: 1px solid #d0d7de !important; width: 40px !important; height: 40px !important; cursor: pointer !important; font-size: 18px !important; color: #57606a !important; transition: all 0.2s !important; display: flex !important; align-items: center !important; justify-content: center !important; }
.vote-btn:hover { background: #eaeef2 !important; }
.vote-btn.upvote { color: #218838 !important; border-color: #218838 !important; background: #fff !important; }
.vote-btn.upvote:hover { color: #1e7e34 !important; border-color: #1e7e34 !important; background: #dafbe1 !important; }
.vote-btn.downvote { color: #d1242f !important; border-color: #d1242f !important; background: #fff !important; }
.vote-btn.downvote:hover { color: #a50e0e !important; border-color: #a50e0e !important; background: #ffebe9 !important; }
.vote-count { font-weight: 700 !important; font-size: 16px !important; color: #24292f !important; }
.question-card-inner { display: flex !important; gap: 16px !important; }
.question-card-content { flex: 1 !important; }
.question-card-title { margin: 0 0 8px 0 !important; color: #0969da !important; font-size: 18px !important; font-weight: 600 !important; }
.question-card-excerpt { color: #24292f !important; margin: 0 0 12px 0 !important; line-height: 1.5 !important; font-size: 14px !important; }
.question-card-meta { display: flex !important; align-items: center !important; gap: 12px !important; font-size: 12px !important; color: #57606a !important; }
.question-card-meta strong { color: #0969da !important; }
.question-card-meta a { color: #0969da !important; text-decoration: none !important; font-weight: 500 !important; }
.question-card-meta a:hover { text-decoration: underline !important; }
.questions-header { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 24px !important; }
.pagination { display: flex !important; justify-content: center !important; align-items: center !important; gap: 8px !important; margin-top: 32px !important; flex-wrap: wrap !important; }
.pagination-btn { padding: 8px 16px !important; background: #fff !important; border: 1px solid #d0d7de !important; color: #24292f !important; text-decoration: none !important; font-size: 14px !important; font-weight: 500 !important; transition: all 0.2s !important; }
.pagination-btn:hover { background: #f6f8fa !important; border-color: #0969da !important; }
.pagination-btn.active { background: #218838 !important; border-color: #218838 !important; color: #fff !important; }
.pagination-ellipsis { padding: 8px !important; color: #57606a !important; font-weight: bold !important; user-select: none !important; }
.admin-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 10; }
.admin-action-btn { padding: 6px 12px; font-size: 12px; font-weight: 600; border: 1px solid #d0d7de; background: #fff; color: #24292f; cursor: pointer; transition: all 0.2s; }
.admin-action-btn:hover { background: #f6f8fa; border-color: #0969da; }
.admin-action-btn.delete { color: #d1242f; border-color: #d1242f; }
.admin-action-btn.delete:hover { background: #d1242f; color: #fff; }
.vote-buttons span { font-weight: 700; font-size: 16px; color: #24292f; }
.loading { text-align: center; padding: 60px; color: #57606a; font-size: 16px; }
.profile-tabs { display: flex; border-bottom: 1px solid #d0d7de; margin-bottom: 24px; gap: 8px; }
.profile-tab { padding: 12px 16px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #57606a; border-bottom: 2px solid transparent; transition: all 0.2s; }
.profile-tab:hover { color: #24292f; }
.profile-tab.active { color: #0969da; border-bottom-color: #0969da; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.user-question-item { border: 1px solid #d0d7de; padding: 16px; margin-bottom: 12px; background: #fff; transition: border-color 0.2s; }
.user-question-item:hover { border-color: #0969da; }
.user-question-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.user-question-title a { color: #0969da; text-decoration: none; }
.user-question-title a:hover { text-decoration: underline; }
.user-question-meta { font-size: 13px; color: #57606a; display: flex; gap: 12px; }
.user-answer-item { border: 1px solid #d0d7de; padding: 16px; margin-bottom: 12px; background: #fff; }
.user-answer-question { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #57606a; }
.user-answer-question a { color: #0969da; text-decoration: none; }
.user-answer-question a:hover { text-decoration: underline; }
.user-answer-content { font-size: 14px; color: #24292f; margin-bottom: 8px; line-height: 1.6; }
.user-answer-meta { font-size: 13px; color: #57606a; }
@media (max-width: 1280px) { #app { width: 90%; } .header-content { padding: 0 24px; } }
@media (max-width: 768px) { header { padding: 12px 16px; } #app { width: 95%; padding: 16px; } .header-content { flex-direction: row; justify-content: space-between; align-items: center; padding: 0 16px; } .user-nav { display: none !important; } .mobile-menu-btn { display: flex !important; } .modal { min-width: unset; width: 90%; padding: 24px; } .question-card { flex-direction: column; } .vote-btn { width: 28px !important; height: 28px !important; font-size: 13px !important; } .vote-count { font-size: 13px !important; } h1 { font-size: 17px !important; } h2 { font-size: 15px !important; } .site-title { font-size: 17px !important; } .answers-header { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; flex-wrap: nowrap !important; margin-bottom: 16px !important; } .answers-header h2 { font-size: 15px !important; margin: 0 !important; white-space: nowrap; } .answer-meta-inline { display: flex !important; flex-wrap: nowrap !important; gap: 6px !important; font-size: 11px !important; white-space: nowrap; } .answer-detail:first-child .answer-meta { display: none !important; } .answer-meta { flex-wrap: nowrap !important; white-space: nowrap; gap: 6px !important; font-size: 11px !important; } .answer-meta span { display: inline !important; } .question-content { font-size: 13px !important; } .answer-content { font-size: 13px !important; } .answer-detail { padding-left: 5px !important; } .question-detail { padding-left: 5px !important; } .pagination { gap: 4px !important; } .pagination-btn { padding: 6px 10px !important; font-size: 12px !important; min-width: 32px !important; } .pagination-btn:nth-child(n+5):not(:last-child):not(.active) { display: none !important; } .pagination-ellipsis { display: none !important; } }
@media (min-width: 1920px) { #app { width: 60%; max-width: 1400px; } }`;

const JS = `class App {
  constructor() {
    this.app = document.getElementById('app');
    this.userNav = document.getElementById('userNav');
    this.currentUser = null;
    this.translations = {};
    this.lang = 'tr';
    this.init();
  }

  // Translation helper method
  t(key, fallback = key) {
    return this.translations[key] || fallback;
  }

  async init() {
    try {
      await this.loadTranslations();
      await Promise.all([this.checkAuth(), this.loadSiteSettings()]);
      this.setupRouter();
      
      // Bind admin actions after auth check
      this.bindAdminActions();
      
      // Check if we have server-rendered content (SSR)
      const hasSSRContent = this.app.innerHTML && !this.app.innerHTML.includes('Loading...');
      
      // Always call route to handle dynamic content (like answer forms)
      this.route();

      // Attach ask question button handler if present
      this.attachAskQuestionButton();
      
      // Attach vote button event listeners (SSR and client-side)
      this.attachVoteButtonListeners();
      this.attachQuestionCardListeners();

      window.addEventListener('popstate', () => this.route());
    } catch (error) {
      console.error('App initialization error:', error);
      this.app.innerHTML = '<div class="loading">' + (this.translations['error.load_app'] || 'Uygulama yüklenemedi. Lütfen yenileyin.') + '</div>';
    }
  }

  attachVoteButtonListeners() {
    // Use event delegation for all vote buttons (SSR and client-side)
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.vote-btn');
      if (!button) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const itemId = button.dataset.id;
      const itemType = button.dataset.type;
      const isUpvote = button.classList.contains('upvote');
      const voteValue = isUpvote ? 1 : -1;
      
      if (itemId && itemType) {
        this.vote(itemType, itemId, voteValue);
      }
    });
  }

  attachQuestionCardListeners() {
    // Use event delegation for question card clicks
    document.addEventListener('click', (e) => {
      // Don't navigate if clicking vote buttons or other interactive elements
      if (e.target.closest('.vote-btn') || e.target.closest('button') || e.target.closest('a')) {
        return;
      }
      
      const card = e.target.closest('.question-card');
      if (!card) return;
      
      const questionId = card.dataset.questionId;
      if (questionId) {
        window.location = '/q/' + questionId;
      }
    });
  }

  attachAskQuestionButton() {
    const btn = document.getElementById('askQuestionBtn');
    if (btn) {
      btn.addEventListener('click', () => this.handleAskQuestionClick());
    }
  }

  async loadTranslations() {
    try {
      const response = await fetch('/api/translations');
      const data = await response.json();
      this.translations = data.translations || {};
      this.lang = data.lang || 'tr';
      document.documentElement.lang = this.lang;
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  async loadSiteSettings() {
    try {
      const response = await fetch('/api/settings');
      const settings = await response.json();
      
      if (settings.site_title) {
        document.getElementById('siteTitle').textContent = settings.site_title;
        document.title = settings.site_title;
      }
      if (settings.site_tagline) {
        document.getElementById('siteTagline').textContent = settings.site_tagline;
      }
    } catch (error) {
      console.error('Failed to load site settings:', error);
    }
  }

  async checkAuth() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await response.json();
      this.currentUser = data.user;
      this.updateNav();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  updateNav() {
    if (this.currentUser) {
      this.userNav.innerHTML = \`
        <a href="/u/\${this.escapeHtml(this.currentUser.username)}" class="user-info">@\${this.escapeHtml(this.currentUser.username)}\${this.currentUser.role === 'admin' ? ' (Admin)' : ''}</a>
        <a href="/profile" class="btn-secondary">\${this.t('nav.profile', 'Profile')}</a>
        \${this.currentUser.role === 'admin' ? \`<a href="/admin" class="btn-secondary">\${this.t('nav.admin', 'Admin Panel')}</a>\` : ''}
        <button class="btn-logout" onclick="app.logout()">\${this.t('nav.logout', 'Logout')}</button>
      \`;
    } else {
      this.userNav.innerHTML = \`
        <a href="/login" class="btn-secondary">\${this.t('nav.login', 'Login')}</a>
        <a href="/register" class="btn-primary">\${this.t('nav.signup', 'Kayıt Ol')}</a>
      \`;
    }
  }

  bindAdminActions() {
    // Only show admin buttons if user is admin
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      // Remove any existing admin buttons if user is not admin
      document.querySelectorAll('.admin-actions').forEach(el => el.remove());
      return;
    }

    // Only target question and answer detail pages, not home page listings
    const targets = document.querySelectorAll('.question-detail[data-type="question"], .answer-detail[data-type="answer"]');
    
    targets.forEach(target => {
      // Skip if already has admin buttons
      if (target.querySelector('.admin-actions')) return;

      const type = target.dataset.type;
      const id = target.dataset.id;
      if (!id) return;

      // Create admin action buttons
      const adminActions = document.createElement('div');
      adminActions.className = 'admin-actions';
      
      if (type === 'question') {
        adminActions.innerHTML = \`
          <button class="admin-action-btn edit" onclick="app.loadAndEditQuestion(\${id})">
            \${this.t('button.edit', 'Edit')}
          </button>
          <button class="admin-action-btn delete" onclick="app.deleteQuestion(\${id})">
            \${this.t('button.delete', 'Delete')}
          </button>
        \`;
      } else {
        adminActions.innerHTML = \`
          <button class="admin-action-btn edit" onclick="app.loadAndEditAnswer(\${id})">
            \${this.t('button.edit', 'Edit')}
          </button>
          <button class="admin-action-btn delete" onclick="app.deleteAnswer(\${id})">
            \${this.t('button.delete', 'Delete')}
          </button>
        \`;
      }
      
      target.appendChild(adminActions);
    });
  }

  setupRouter() {
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const path = new URL(e.target.href).pathname;
        this.navigate(path);
      }
    });
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.route();
  }

  route() {
    const path = window.location.pathname;

    if (path === '/' || path.startsWith('/p/')) {
      const page = path === '/' ? 1 : parseInt(path.split('/')[2]) || 1;
      this.showHome(page);
    } else if (path === '/login') {
      this.showLogin();
    } else if (path === '/register') {
      this.showRegister();
    } else if (path === '/profile') {
      this.showProfile();
    } else if (path === '/admin') {
      this.showAdmin();
    } else if (path.startsWith('/q/')) {
      const questionId = path.split('/')[2];
      this.handleQuestionPage(questionId);
    } else if (path.startsWith('/u/')) {
      const username = path.split('/')[2];
      this.showUser(username);
    } else {
      this.show404();
    }
  }

  handleQuestionPage(questionId) {
    // Check if SSR content exists
    const placeholder = document.getElementById('answerFormPlaceholder');
    
    if (placeholder && !window.app._hasNavigated) {
      // SSR content exists, just populate the answer form
      window.app._hasNavigated = true;
      this.populateAnswerForm(questionId, placeholder);
    } else {
      // No SSR, render client-side
      this.showQuestion(questionId);
    }
  }

  populateAnswerForm(questionId, placeholder) {
    // Bind admin actions for SSR content
    this.bindAdminActions();
    
    if (this.currentUser) {
      placeholder.innerHTML = \`
        <div class="auth-form">
          <h3>\${this.t('misc.your_answer', 'Cevabınız')}</h3>
          <div id="answerMessage"></div>
          <form id="answerForm">
            <div class="form-group">
              <label for="answerContent">\${this.t('misc.share_knowledge', 'Bilginizi paylaşın')}</label>
              <textarea id="answerContent" rows="6" required style="min-height: 100px;"></textarea>
            </div>
            <button type="submit" class="submit-btn">\${this.t('button.post_answer', 'Cevap Gönder')}</button>
          </form>
        </div>
      \`;
      
      document.getElementById('answerForm').addEventListener('submit', (e) => this.handlePostAnswer(e, questionId));
    } else {
      placeholder.innerHTML = \`<div class="auth-link">\${this.t('message.login_to_answer', 'Cevap göndermek için giriş yapın')}</div>\`;
    }
  }

  async showHome(page = 1) {
    // Skip re-rendering only on initial page load when SSR content matches current page
    const isInitialLoad = !window.app._hasNavigated;
    const hasSSRContent = this.app.innerHTML.includes('question-card') || this.app.innerHTML.includes('questions-container');
    
    if (isInitialLoad && hasSSRContent) {
      window.app._hasNavigated = true;
      return;
    }
    
    window.app._hasNavigated = true;
    this.app.innerHTML = '<div class="loading">' + this.t('misc.loading_questions', 'Sorular yükleniyor...') + '</div>';
    
    // For client-side navigation, just reload the page to get SSR content for the new page
    window.location.href = page === 1 ? '/' : \`/p/\${page}\`;
  }

  async showQuestion(questionId) {
    this.app.innerHTML = '<div class="loading">' + this.t('misc.loading_question', 'Soru yükleniyor...') + '</div>';
    
    try {
      const response = await fetch(\`/api/q/\${questionId}\`);
      
      // Handle 404 - Question not found
      if (response.status === 404) {
        this.app.innerHTML = \`
          <div style="text-align: center; padding: 80px 20px; max-width: 600px; margin: 0 auto;">
            <h1 style="font-size: 72px; margin: 0; color: #d1242f;">404</h1>
            <h2 style="font-size: 28px; margin: 16px 0; color: #24292f;">\${this.t('error.question_not_found', 'Question Not Found')}</h2>
            <p style="font-size: 16px; color: #57606a; margin-bottom: 32px;">
              \${this.t('error.question_deleted', 'This question may have been deleted or does not exist.')}
            </p>
            <a href="/" class="btn-primary" style="display: inline-block; padding: 12px 24px; background: #28a745; color: #fff; text-decoration: none; font-weight: 600; border-radius: 6px;">
              \${this.t('button.back_home', 'Back to Home')}
            </a>
          </div>
        \`;
        return;
      }
      
      const data = await response.json();
      
      if (data.error) {
        this.app.innerHTML = \`<div class="loading">Error: \${data.error}</div>\`;
        return;
      }

      const { question, answers } = data;
      
      this.app.innerHTML = \`
        <nav class="breadcrumb">
          <a href="/">\${this.t('nav.home', 'Home')}</a>
          <span>></span>
          <span>\${this.escapeHtml(question.title)}</span>
        </nav>
        
        <div class="question-detail">
          \${this.currentUser ? \`
            <div class="vote-buttons">
              <button onclick="app.vote('question', \${question.id}, 1)" class="vote-btn">▲</button>
              <span id="question-\${question.id}-votes">\${question.votes || 0}</span>
              <button onclick="app.vote('question', \${question.id}, -1)" class="vote-btn">▼</button>
            </div>
          \` : ''}
          <div class="content-body">
            <h1>\${this.escapeHtml(question.title)}</h1>
            <div class="question-content">\${this.formatTextWithParagraphs(question.content)}</div>
            <div class="question-meta">
             
              \${question.username ? \`<a href="/u/\${this.escapeHtml(question.username)}">@\${this.escapeHtml(question.username)}</a>\` : '<span>' + this.t('misc.anonymous', 'Anonim') + '</span>'}
              <span>•</span>
              <span>\${new Date(question.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div class="answers-section">
          <div class="answers-header">
            <h2>\${this.t('misc.answers', 'Answers')} (\${answers.length})</h2>
            \${answers.length > 0 ? \`
              <span class="answer-meta-inline">
                \${answers[0].username ? \`\${this.t('user.asked_by', '')} <a href="/u/\${this.escapeHtml(answers[0].username)}">@\${this.escapeHtml(answers[0].username)}</a>\` : this.t('misc.anonymous', 'Anonim')}
                <span>•</span>
                <span>\${new Date(answers[0].created_at).toLocaleDateString()}</span>
              </span>
            \` : ''}
          </div>
          
          \${answers.length > 0 ? \`
            <div class="answers-list">
              \${answers.map((a, index) => \`
                <div class="answer-detail">
                  \${this.currentUser ? \`
                    <div class="vote-buttons">
                      <button onclick="app.vote('answer', \${a.id}, 1)" class="vote-btn">▲</button>
                      <span id="answer-\${a.id}-votes">\${a.votes || 0}</span>
                      <button onclick="app.vote('answer', \${a.id}, -1)" class="vote-btn">▼</button>
                    </div>
                  \` : ''}
                  <div class="content-body">
                    <div class="answer-content">\${this.formatTextWithParagraphs(a.content)}</div>
                    <div class="answer-meta">
                      \${a.username ? \`<a href="/u/\${this.escapeHtml(a.username)}">@\${this.escapeHtml(a.username)}</a>\` : '<span>' + this.t('misc.anonymous', 'Anonim') + '</span>'}
                      <span>•</span>
                      <span>\${new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              \`).join('')}
            </div>
          \` : '<div class="no-answers">' + this.t('message.no_answers_long', 'Bu soru için henüz cevap yok. İlk cevaplayan siz olun!') + '</div>'}
        </div>

        \${this.currentUser ? \`
          <div class="auth-form">
            <h3>\${this.t('misc.your_answer', 'Cevabınız')}</h3>
            <div id="answerMessage"></div>
            <form id="answerForm">
              <div class="form-group">
                <label for="answerContent">\${this.t('misc.share_knowledge', 'Bilginizi paylaşın')}</label>
                <textarea id="answerContent" rows="6" required style="min-height: 100px;"></textarea>
              </div>
              <button type="submit" class="submit-btn">\${this.t('button.post_answer', 'Cevap Gönder')}</button>
            </form>
          </div>
        \` : '<div class="auth-link">' + this.t('message.login_to_answer', 'Cevap göndermek için giriş yapın') + '</div>'}
      \`;

      if (this.currentUser) {
        document.getElementById('answerForm').addEventListener('submit', (e) => this.handlePostAnswer(e, questionId));
      }
    } catch (error) {
      this.app.innerHTML = '<div class="loading">' + this.t('error.load_question', 'Soru yüklenemedi') + ': ' + error.message + '</div>';
    }
  }

  showLogin() {
    this.app.innerHTML = \`
      <div class="auth-form">
        <h2>\${this.t('auth.login_title', 'Login')}</h2>
        <div id="authMessage"></div>
        <form id="loginForm">
          <div class="form-group">
            <label for="email">\${this.t('label.email', 'Email')}</label>
            <input type="email" id="email" required>
          </div>
          <div class="form-group">
            <label for="password">\${this.t('label.password', 'Password')}</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="submit-btn">\${this.t('button.login', 'Giriş Yap')}</button>
        </form>
        <div class="auth-link">
          \${this.t('auth.no_account', "Hesabınız yok mu?")} <a href="/register">\${this.t('button.signup', 'Kayıt Ol')}</a>
        </div>
        <div class="auth-link" style="margin-top: 0.5rem">
          
        </div>
      </div>
    \`;

    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
  }

  showRegister() {
    this.app.innerHTML = \`
      <div class="auth-form">
        <h2>\${this.t('auth.create_account', 'Create Account')}</h2>
        <div id="authMessage"></div>
        <form id="registerForm">
          <div class="form-group">
            <label for="username">\${this.t('label.username', 'Username')}</label>
            <input type="text" id="username" required maxlength="12" pattern="[a-z0-9]+" title="\${this.t('auth.username_rules', 'Lowercase letters and numbers only, max 12 characters')}">
            <small style="color: var(--text-muted); display: block; margin-top: 0.25rem;">\${this.t('auth.username_rules', 'Lowercase letters and numbers only, max 12 characters')}</small>
          </div>
          <div class="form-group">
            <label for="email">\${this.t('label.email', 'Email')}</label>
            <input type="email" id="email" required>
          </div>
          <div class="form-group">
            <label for="password">\${this.t('label.password', 'Password')}</label>
            <input type="password" id="password" required minlength="6">
          </div>
          <button type="submit" class="submit-btn">\${this.t('button.signup', 'Kayıt Ol')}</button>
        </form>
        <div class="auth-link">
          \${this.t('auth.have_account', 'Zaten hesabınız var mı?')} <a href="/login">\${this.t('button.login', 'Giriş Yap')}</a>
        </div>
      </div>
    \`;

    document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
  }

  async showAdmin() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.navigate('/');
      return;
    }

    this.app.innerHTML = '<div class="loading">Loading admin panel...</div>';

    try {
      // Load all data
      const [settings, users, questions, answers] = await Promise.all([
        fetch('/api/admin/settings', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/users', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/content/questions', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/content/answers', { credentials: 'include' }).then(r => r.json())
      ]);

    this.app.innerHTML = \`
      <style>
        .admin-container { max-width: 1200px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #d0d7de; }
        .admin-tabs { display: flex; gap: 0; margin-bottom: 2rem; border-bottom: 1px solid #d0d7de; }
        .admin-tab { padding: 12px 24px; background: transparent; border: 1px solid transparent; border-bottom: none; color: #656d76; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .admin-tab:hover { color: #24292f; background: #f6f8fa; border-color: #d0d7de; border-bottom-color: transparent; }
        .admin-tab.active { color: #24292f; background: #fff; border-color: #d0d7de; border-bottom-color: #fff; font-weight: 600; }
        .admin-content { display: none; }
        .admin-content.active { display: block; }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-top: 24px; }
        .admin-card { background: #fff; padding: 24px; border: 1px solid #d0d7de; }
        .admin-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .admin-card h3 { margin: 0; color: #24292f; font-size: 18px; font-weight: 600; }
        .admin-table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #fff; }
        .admin-table th { text-align: left; padding: 12px; background: #f6f8fa; border: 1px solid #d0d7de; font-weight: 600; font-size: 13px; color: #24292f; }
        .admin-table td { padding: 12px; border: 1px solid #d0d7de; font-size: 14px; color: #24292f; }
        .admin-table tr:hover { background: #f6f8fa; }
        .admin-btn { padding: 10px 20px; background: #2da44e; color: #fff; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s; }
        .admin-btn:hover { background: #2c974b; }
        .admin-btn-danger { background: #d1242f; }
        .admin-btn-danger:hover { background: #a50e0e; }
        .admin-btn-success { background: #2da44e; }
        .admin-btn-success:hover { background: #2c974b; }
        .admin-btn-sm { padding: 8px 16px; font-size: 13px; }
        .admin-form { background: #fff; padding: 24px; border: 1px solid #d0d7de; margin-bottom: 24px; }
        .admin-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 4px 12px; font-size: 13px; font-weight: 600; border: 1px solid transparent; }
        .badge-admin { background: #8250df; color: #fff; border-color: #8250df; }
        .badge-user { background: #0969da; color: #fff; border-color: #0969da; }
        .badge-banned { background: #d1242f; color: #fff; border-color: #d1242f; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(31, 35, 40, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: #fff; padding: 32px; min-width: 560px; max-width: 640px; border: 1px solid #d0d7de; box-shadow: 0 16px 64px rgba(31, 35, 40, 0.3); }
        .modal h3 { margin-top: 0; margin-bottom: 24px; color: #24292f; font-size: 20px; font-weight: 600; }
        .modal-actions { display: flex; gap: 16px; margin-top: 24px; justify-content: flex-end; }
      </style>

      <div class="admin-container">
        <div class="admin-header">
          <div>
            <h1 style="margin: 0;">\${this.t('admin.panel', 'Yönetim Paneli')}</h1>
            <p style="color: var(--text-muted); margin: 0.5rem 0 0 0;">\${this.t('admin.welcome', 'Hoş geldiniz')}, @\${this.escapeHtml(this.currentUser.username)}</p>
          </div>
          <a href="/" class="admin-btn">\${this.t('button.back_site', '← Siteye Dön')}</a>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab active" onclick="app.switchAdminTab('settings')">\${this.t('admin.tab_settings')}</button>
          <button class="admin-tab" onclick="app.switchAdminTab('users')">\${this.t('admin.tab_users')}</button>
          <button class="admin-tab" onclick="app.switchAdminTab('questions')">\${this.t('admin.tab_questions')}</button>
          <button class="admin-tab" onclick="app.switchAdminTab('answers')">\${this.t('admin.tab_answers')}</button>
        </div>

        <div id="admin-settings" class="admin-content active">
          <div class="admin-form">
            <h3 style="margin-top: 0;">\${this.t('admin.site_settings', 'Site Ayarları')}</h3>
            <div id="settingsMessage"></div>
            <form id="settingsForm">
              <div class="form-group">
                <label>\${this.t('label.site_title', 'Site Başlığı')}</label>
                <input type="text" id="siteTitle" value="\${this.escapeHtml(settings.site_title || '')}" required style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
              </div>
              <div class="form-group">
                <label>\${this.t('label.site_tagline', 'Site Sloganı')}</label>
                <input type="text" id="siteTagline" value="\${this.escapeHtml(settings.site_tagline || '')}" required style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
              </div>
              <div class="form-group">
                <label>\${this.t('label.default_language', 'Varsayılan Dil')}</label>
                <select id="defaultLanguage" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
                  <option value="tr" \${(settings.default_language || 'tr') === 'tr' ? 'selected' : ''}>Türkçe (Turkish)</option>
                  <option value="en" \${settings.default_language === 'en' ? 'selected' : ''}>English</option>
                </select>
              </div>
              <button type="submit" class="admin-btn">\${this.t('button.save_settings', 'Ayarları Kaydet')}</button>
            </form>
          </div>
        </div>

        <div id="admin-users" class="admin-content">
          <div class="admin-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="margin: 0;">\${this.t('admin.all_users', 'Tüm Kullanıcılar')} (\${users.users.length})</h3>
              <button onclick="app.showAddUserModal()" class="admin-btn admin-btn-success">\${this.t('button.add_user', 'Add User')}</button>
            </div>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>\${this.t('table.user_id', 'Kullanıcı ID')}</th>
                  <th>\${this.t('table.username', 'Kullanıcı Adı')}</th>
                  <th>\${this.t('table.email', 'E-posta')}</th>
                  <th>\${this.t('table.role', 'Rol')}</th>
                  <th>\${this.t('table.status', 'Durum')}</th>
                  <th>\${this.t('table.joined', 'Katılma')}</th>
                  <th>\${this.t('table.actions', 'İşlemler')}</th>
                </tr>
              </thead>
              <tbody>
                \${users.users.map(user => \`
                  <tr>
                    <td><code>\${user.id}</code></td>
                    <td><strong>@\${this.escapeHtml(user.username)}</strong></td>
                    <td>\${this.escapeHtml(user.email)}</td>
                    <td><span class="badge badge-\${user.role}">\${user.role.toUpperCase()}</span></td>
                    <td>\${user.banned ? '<span class="badge badge-banned">' + this.t('status.banned', 'BANNED') + '</span>' : '<span style="color: #27ae60;">' + this.t('status.active', 'Active') + '</span>'}</td>
                    <td>\${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="app.toggleUserRole('\${user.id}', '\${user.role}')" class="admin-btn admin-btn-sm">\${user.role === 'admin' ? this.t('button.make_user', 'Make User') : this.t('button.make_admin', 'Make Admin')}</button>
                      <button onclick="app.toggleBan('\${user.id}', \${user.banned ? 1 : 0})" class="admin-btn admin-btn-sm \${user.banned ? 'admin-btn-success' : 'admin-btn-danger'}">\${user.banned ? this.t('button.unban', 'Unban') : this.t('button.ban', 'Ban')}</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div id="admin-questions" class="admin-content">
          <div class="admin-card">
            <h3>\${this.t('admin.all_questions')} (\${questions.questions.length})</h3>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>\${this.t('table.id', 'ID')}</th>
                  <th>\${this.t('table.title', 'Başlık')}</th>
                  <th>\${this.t('table.author', 'Yazar')}</th>
                  <th>\${this.t('table.votes', 'Oylar')}</th>
                  <th>\${this.t('table.date', 'Tarih')}</th>
                  <th>\${this.t('table.actions', 'İşlemler')}</th>
                </tr>
              </thead>
              <tbody>
                \${questions.questions.map(q => \`
                  <tr>
                    <td>\${q.id}</td>
                    <td><strong>\${this.escapeHtml(q.title)}</strong></td>
                    <td>@\${this.escapeHtml(q.username || this.t('misc.anonymous', 'Anonymous'))}</td>
                    <td>\${q.votes || 0}</td>
                    <td>\${new Date(q.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="app.editQuestionById(this)" data-id="\${q.id}" data-title="\${this.escapeHtml(q.title)}" data-content="\${this.escapeHtml(q.content)}" class="admin-btn admin-btn-sm">\${this.t('button.edit', 'Edit')}</button>
                      <button onclick="app.changeQuestionAuthor(\${q.id}, '\${this.escapeHtml(q.username || '')}')" class="admin-btn admin-btn-sm">\${this.t('button.change_author', 'Change Author')}</button>
                      <button onclick="app.deleteQuestion(\${q.id})" class="admin-btn admin-btn-sm admin-btn-danger">\${this.t('button.delete', 'Delete')}</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div id="admin-answers" class="admin-content">
          <div class="admin-card">
            <h3>\${this.t('admin.all_answers')} (\${answers.answers.length})</h3>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>\${this.t('table.id', 'ID')}</th>
                  <th>\${this.t('table.title', 'Soru')}</th>
                  <th>\${this.t('table.content', 'İçerik Önizleme')}</th>
                  <th>\${this.t('table.author', 'Yazar')}</th>
                  <th>\${this.t('table.votes', 'Oylar')}</th>
                  <th>\${this.t('table.date', 'Tarih')}</th>
                  <th>\${this.t('table.actions', 'İşlemler')}</th>
                </tr>
              </thead>
              <tbody>
                \${answers.answers.map(a => \`
                  <tr>
                    <td>\${a.id}</td>
                    <td>\${this.escapeHtml(a.question_title.substring(0, 40))}...</td>
                    <td>\${this.escapeHtml(a.content.substring(0, 60))}...</td>
                    <td>@\${this.escapeHtml(a.username || this.t('misc.anonymous', 'Anonymous'))}</td>
                    <td>\${a.votes || 0}</td>
                    <td>\${new Date(a.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="app.editAnswerById(this)" data-id="\${a.id}" data-content="\${this.escapeHtml(a.content)}" class="admin-btn admin-btn-sm">\${this.t('button.edit', 'Edit')}</button>
                      <button onclick="app.changeAnswerAuthor(\${a.id}, '\${this.escapeHtml(a.username || '')}')" class="admin-btn admin-btn-sm">\${this.t('button.change_author', 'Change Author')}</button>
                      <button onclick="app.deleteAnswer(\${a.id})" class="admin-btn admin-btn-sm admin-btn-danger">\${this.t('button.delete', 'Delete')}</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    \`;

      // Attach event listeners
      document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSaveSettings(e));
    } catch (error) {
      console.error('Admin panel error:', error);
      this.app.innerHTML = '<div class="loading">Error loading admin panel: ' + error.message + '</div>';
    }
  }

  async showUser(username) {
    this.app.innerHTML = '<div class="loading">Loading profile...</div>';
    
    try {
      const response = await fetch(\`/api/u/\${username}\`);
      const data = await response.json();
      
      if (data.error) {
        this.app.innerHTML = \`<div class="loading">Error: \${data.error}</div>\`;
        return;
      }

      const { user, questions, answers } = data;
      
      this.app.innerHTML = \`
        <a href="/" class="back-btn">\${this.t('button.back_home', '← Ana Sayfa')}</a>
        
        <div class="auth-form">
          <h2>@\${this.escapeHtml(user.username)}</h2>
          <p style="text-align: center; color: var(--text-muted); margin-top: 0.5rem;">
            \${user.role === 'admin' ? '<span style="color: var(--primary);">' + this.t('misc.administrator', 'Administrator') + '</span>' : this.t('misc.member', 'Member')}
          </p>
          <p style="text-align: center; color: var(--text-muted); margin-top: 0.5rem; font-size: 0.9rem;">
            \${this.t('misc.joined', 'Joined')} \${new Date(user.created_at).toLocaleDateString()}
          </p>

          <div class="profile-tabs">
            <button class="profile-tab active" onclick="app.switchTab('questions')">\${this.t('profile.questions', 'Questions')} (\${questions.length})</button>
            <button class="profile-tab" onclick="app.switchTab('answers')">\${this.t('profile.answers', 'Answers')} (\${answers.length})</button>
          </div>

          <div id="tab-questions" class="tab-content active">
            \${questions.length === 0 ? '<p style="color: #57606a; text-align: center;">' + this.t('profile.no_questions', 'No questions yet') + '</p>' : ''}
            \${questions.map(q => \`
              <div class="user-question-item">
                <div class="user-question-title">
                  <a href="/q/\${q.id}">\${this.escapeHtml(q.title)}</a>
                </div>
                <div class="user-question-meta">
                  <span>\${q.votes} \${this.t('misc.votes', 'votes')}</span>
                  <span>\${q.answer_count} \${this.t('misc.answers', 'answers')}</span>
                  <span>\${new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            \`).join('')}
          </div>

          <div id="tab-answers" class="tab-content">
            \${answers.length === 0 ? '<p style="color: #57606a; text-align: center;">' + this.t('profile.no_answers', 'No answers yet') + '</p>' : ''}
            \${answers.map(a => \`
              <div class="user-answer-item">
                <div class="user-answer-question">
                  \${this.t('profile.answered', 'Answered')}: <a href="/q/\${a.question_id}">\${this.escapeHtml(a.question_title || 'Question #' + a.question_id)}</a>
                </div>
                <div class="user-answer-content">\${this.formatTextWithParagraphs(a.content.substring(0, 200))}\${a.content.length > 200 ? '...' : ''}</div>
                <div class="user-answer-meta">
                  <span>\${a.votes} \${this.t('misc.votes', 'votes')}</span>
                  <span>\${new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    } catch (error) {
      this.app.innerHTML = \`<div class="loading">Error loading profile: \${error.message}</div>\`;
    }
  }

  switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(\`tab-\${tabName}\`).classList.add('active');
  }

  showProfile() {
    if (!this.currentUser) {
      this.navigate('/login');
      return;
    }

    this.app.innerHTML = \`
      <div class="auth-form">
        <h2>\${this.t('profile.settings', 'Profile Settings')}</h2>
        <p style="text-align: center; color: var(--text-muted); margin-bottom: 2rem;">
          \${this.t('profile.logged_in_as', 'Logged in as')} <strong>@\${this.escapeHtml(this.currentUser.username)}</strong> (\${this.escapeHtml(this.currentUser.email)})
        </p>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">\${this.t('profile.change_password', 'Şifre Değiştir')}</h3>
        <div id="passwordMessage"></div>
        <form id="passwordForm">
          <div class="form-group">
            <label for="currentPassword">\${this.t('label.current_password', 'Mevcut Şifre')}</label>
            <input type="password" id="currentPassword" required>
          </div>
          <div class="form-group">
            <label for="newPassword">\${this.t('label.new_password', 'Yeni Şifre')}</label>
            <input type="password" id="newPassword" required minlength="6">
          </div>
          <div class="form-group">
            <label for="confirmPassword">\${this.t('label.confirm_password', 'Yeni Şifreyi Onayla')}</label>
            <input type="password" id="confirmPassword" required minlength="6">
          </div>
          <button type="submit" class="submit-btn">\${this.t('button.update_password', 'Şifreyi Güncelle')}</button>
        </form>
      </div>
      <a href="/" class="back-btn" style="display: inline-block; margin-top: 1rem;">\${this.t('button.back_home', '← Ana Sayfa')}</a>
    \`;

    document.getElementById('passwordForm').addEventListener('submit', (e) => this.handleChangePassword(e));
  }

  async handleLogin(e) {
    e.preventDefault();
    const messageEl = document.getElementById('authMessage');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.login', 'Login successful!') + '</div>';
        this.currentUser = data.user;
        this.updateNav();
        setTimeout(() => this.navigate('/'), 1000);
      } else {
        messageEl.innerHTML = \`<div class="error-message">\${data.error}</div>\`;
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.login', 'Login failed') + ': ' + error.message + '</div>';
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const messageEl = document.getElementById('authMessage');
    const username = document.getElementById('username').value.toLowerCase();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.registration', 'Registration successful!') + '</div>';
        this.currentUser = data.user;
        this.updateNav();
        setTimeout(() => this.navigate('/'), 1000);
      } else {
        messageEl.innerHTML = \`<div class="error-message">\${data.error}</div>\`;
      }
    } catch (error) {
      messageEl.innerHTML = \`<div class="error-message">Registration failed: \${error.message}</div>\`;
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      this.currentUser = null;
      this.updateNav();
      this.navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  handleAskQuestionClick() {
    if (!this.currentUser) {
      this.navigate('/login');
      return;
    }
    
    // Show question form modal
    this.showQuestionModal();
  }

  showQuestionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = \`
      <div class="modal" style="min-width: 600px; position: relative;">
        <button onclick="this.closest('.modal-overlay').remove()" style="position: absolute; top: 16px; right: 16px; background: #d1242f; color: #fff; border: none; width: 32px; height: 32px; font-size: 20px; font-weight: 700; cursor: pointer; line-height: 1; padding: 0;">×</button>
        <h3>\${this.t('modal.ask_question')}</h3>
        <div id="questionModalMessage"></div>
        <form id="questionModalForm">
          <div class="form-group">
            <label>\${this.t('label.question_title', 'Soru Başlığı')}</label>
            <input type="text" id="modalQuestionTitle" required maxlength="200" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
          </div>
          <div class="form-group">
            <label>\${this.t('label.question_details', 'Soru Detayları')}</label>
            <textarea id="modalQuestionContent" rows="8" required style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px; font-family: inherit;"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="admin-btn" style="background: var(--border);">\${this.t('button.cancel', 'Cancel')}</button>
            <button type="submit" class="admin-btn">\${this.t('button.post_question', 'Post Question')}</button>
          </div>
        </form>
      </div>
    \`;
    document.body.appendChild(modal);
    
    document.getElementById('questionModalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmitQuestion(modal);
    });
  }

  async handleSubmitQuestion(modal) {
    const messageEl = document.getElementById('questionModalMessage');
    const title = document.getElementById('modalQuestionTitle').value;
    const content = document.getElementById('modalQuestionContent').value;

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.question_posted', 'Question posted successfully!') + '</div>';
        setTimeout(() => {
          modal.remove();
          this.navigate(\`/q/\${data.questionId}\`);
        }, 1000);
      } else {
        messageEl.innerHTML = \`<div class="error-message">\${data.error}</div>\`;
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.post_question', 'Failed to post question') + ': ' + error.message + '</div>';
    }
  }

  toggleQuestionForm() {
    const formContainer = document.getElementById('questionFormContainer');
    if (formContainer) {
      const isHidden = formContainer.style.display === 'none';
      formContainer.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  async handleAskQuestion(e) {
    e.preventDefault();
    const messageEl = document.getElementById('questionMessage');
    const title = document.getElementById('questionTitle').value;
    const content = document.getElementById('questionContent').value;

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.question_posted', 'Soru başarıyla gönderildi!') + '</div>';
        setTimeout(() => this.navigate(\`/q/\${data.questionId}\`), 1000);
      } else {
        messageEl.innerHTML = \`<div class="error-message">\${data.error}</div>\`;
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.post_question', 'Soru gönderilemedi') + ': ' + error.message + '</div>';
    }
  }

  async handlePostAnswer(e, questionId) {
    e.preventDefault();
    const messageEl = document.getElementById('answerMessage');
    const content = document.getElementById('answerContent').value;

    try {
      const response = await fetch(\`/api/q/\${questionId}/answer\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.answer_posted', 'Cevap başarıyla gönderildi!') + '</div>';
        setTimeout(() => this.showQuestion(questionId), 1000);
      } else {
        messageEl.innerHTML = \`<div class="error-message">\${data.error}</div>\`;
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.post_answer', 'Cevap gönderilemedi') + ': ' + error.message + '</div>';
    }
  }

  async handleChangePassword(e) {
    e.preventDefault();
    const messageEl = document.getElementById('passwordMessage');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      messageEl.innerHTML = '<div class="error-message">New passwords do not match</div>';
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.password_changed', 'Şifre başarıyla değiştirildi!') + '</div>';
        document.getElementById('passwordForm').reset();
      } else {
        messageEl.innerHTML = \`<div class="error-message">\${data.error}</div>\`;
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.change_password', 'Şifre değiştirilemedi') + ': ' + error.message + '</div>';
    }
  }

  show404() {
    this.app.innerHTML = \`
      <div class="loading">
        <h2>\${this.t('error.404_title', '404 - Sayfa Bulunamadı')}</h2>
        <p>\${this.t('error.404_message', 'Aradığınız sayfa mevcut değil.')}</p>
        <a href="/" class="back-btn">\${this.t('button.back_home', '← Ana Sayfa')}</a>
      </div>
    \`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTextWithParagraphs(text) {
    if (!text) return '';
    
    // Extract existing iframes (like YouTube embeds) before escaping
    const iframes = [];
    let processedText = text.replace(/<iframe[^>]*>.*?<\\/iframe>/gi, (match) => {
      const placeholder = \`___IFRAME_\${iframes.length}___\`;
      iframes.push(match);
      return placeholder;
    });
    
    // Parse quote blocks first (before escaping) - match author up to first comma
    const quoteRegex = /\\[quote="([^,]+),\\s*post:(\\d+),\\s*topic:(\\d+)"\\]([\\s\\S]*?)\\[\\/quote\\]/g;
    
    // Replace quote blocks with placeholders
    const quotes = [];
    processedText = processedText.replace(quoteRegex, (match, author, postNum, topicId, content) => {
      const placeholder = \`___QUOTE_\${quotes.length}___\`;
      quotes.push({
        author: this.escapeHtml(author),
        postNum,
        topicId,
        content: this.escapeHtml(content.trim())
      });
      return placeholder;
    });
    
    // Escape the remaining text
    const escaped = this.escapeHtml(processedText);
    
    // Convert YouTube URLs to embeds (before general link conversion)
    const youtubeRegex = /https?:\\/\\/(?:www\\.)?(?:youtube\\.com\\/(?:watch\\?v=|embed\\/)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/g;
    const withYouTube = escaped.replace(youtubeRegex, (match, videoId) => {
      return \`<div class="video-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/\${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\`;
    });
    
    // Convert remaining URLs to clickable links (after YouTube conversion)
    const urlRegex = /(https?:\\/\\/[^\\s<]+[^<.,:;"')\\]\\s])/g;
    const linkedText = withYouTube.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Process paragraphs
    const paragraphs = linkedText.split(/\\n\\n+/);
    let formatted = paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => \`<p style="margin-bottom: 12px;">\${p.replace(/\\n/g, '<br>')}</p>\`)
      .join('');
    
    // Replace placeholders with styled quote blocks
    quotes.forEach((quote, index) => {
      const quoteHtml = \`<blockquote class="quote-block">
        <div class="quote-header">
          <a href="/u/\${quote.author.toLowerCase()}">@\${quote.author}</a> said in <a href="/q/\${quote.topicId}">question #\${quote.topicId}</a>:
        </div>
        <div class="quote-content">\${quote.content.replace(/\\n/g, '<br>')}</div>
      </blockquote>\`;
      formatted = formatted.replace(\`___QUOTE_\${index}___\`, quoteHtml);
    });
    
    // Restore extracted iframes
    iframes.forEach((iframe, index) => {
      formatted = formatted.replace(\`___IFRAME_\${index}___\`, iframe);
    });
    
    return formatted || \`<p>\${escaped}</p>\`;
  }

  escapeJs(text) {
    if (!text) return '';
    return JSON.stringify(text).slice(1, -1);
  }

  getQualityBadge(votes) {
    if (votes >= 5) {
      return '<span style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 0.375rem 0.875rem; border-radius: 16px; font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);">' + this.t('badge.high_quality', 'Yüksek Kalite') + '</span>';
    } else if (votes <= -3) {
      return '<span style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 0.375rem 0.875rem; border-radius: 16px; font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);">' + this.t('badge.low_quality', 'Düşük Kalite') + '</span>';
    }
    return ''; // No badge for votes between -2 and 4
  }

  async vote(itemType, itemId, voteValue) {
    if (!this.currentUser) {
      alert(this.t('error.login_required', 'Lütfen oy vermek için giriş yapın'));
      this.navigate('/login');
      return;
    }

    try {
      const url = '/api/' + itemType + 's/' + itemId + '/vote';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteValue }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the vote count in the UI
        // Use 'a' for answers, 'question' for questions
        const prefix = itemType === 'answer' ? 'a' : itemType;
        const voteElementId = prefix + '-' + itemId + '-votes';
        const voteElement = document.getElementById(voteElementId);
        if (voteElement) {
          voteElement.textContent = data.votes;
        }
        
        // Update quality badge without refreshing the page
        const badgeElementId = prefix + '-' + itemId + '-badge';
        const badgeElement = document.getElementById(badgeElementId);
        if (badgeElement) {
          badgeElement.outerHTML = this.getQualityBadge(data.votes);
        }
      } else {
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.vote_failed', 'Oy kullanılamadı') + ': ' + error.message);
    }
  }

  // Admin handler methods
  switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('admin-' + tabName).classList.add('active');
  }

  async handleSaveSettings(e) {
    e.preventDefault();
    const messageEl = document.getElementById('settingsMessage');
    const site_title = document.getElementById('siteTitle').value;
    const site_tagline = document.getElementById('siteTagline').value;
    const default_language = document.getElementById('defaultLanguage').value;

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_title, site_tagline, default_language }),
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        messageEl.innerHTML = '<div class="success-message">' + this.t('success.settings_saved', 'Ayarlar kaydedildi! Yeniden yükleniyor...') + '</div>';
        // Force hard reload without cache
        setTimeout(() => {
          window.location.reload(true);
        }, 1000);
      } else {
        messageEl.innerHTML = '<div class="error-message">' + data.error + '</div>';
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.save_settings', 'Failed to save settings') + ': ' + error.message + '</div>';
    }
  }

  async toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(this.t('confirm.change_role', 'Kullanıcı rolünü değiştir') + ': ' + newRole + '?')) return;

    try {
      const response = await fetch(\`/api/admin/users/\${userId}/role\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      });

      if (response.ok) {
        this.showAdmin();
      } else {
        const data = await response.json();
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.update_user_role', 'Kullanıcı rolü güncellenemedi') + ': ' + error.message);
    }
  }

  async toggleBan(userId, currentBanned) {
    const newBanned = currentBanned ? 0 : 1;
    if (!confirm(newBanned ? this.t('confirm.ban_user', 'Ban this user?') : this.t('confirm.unban_user', 'Unban this user?'))) return;

    try {
      const response = await fetch(\`/api/admin/users/\${userId}/ban\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: newBanned }),
        credentials: 'include'
      });

      if (response.ok) {
        this.showAdmin();
      } else {
        const data = await response.json();
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.update_ban_status', 'Kullanıcı ban durumu güncellenemedi') + ': ' + error.message);
    }
  }

  editQuestionById(button) {
    const id = button.dataset.id;
    const title = button.dataset.title;
    const content = button.dataset.content;
    this.showEditQuestionModal(id, title, content);
  }

  async loadAndEditQuestion(id) {
    try {
      const response = await fetch(\`/api/q/\${id}\`);
      const data = await response.json();
      if (data.question) {
        this.showEditQuestionModal(id, data.question.title, data.question.content);
      }
    } catch (error) {
      alert(this.t('error.load_question', 'Failed to load question'));
    }
  }

  showEditQuestionModal(id, title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = \`
      <div class="modal">
        <h3>\${this.t('modal.edit_question', 'Edit Question')}</h3>
        <div class="form-group">
          <label>\${this.t('label.question_title', 'Question Title')}</label>
          <input type="text" id="modalQuestionTitle" value="\${this.escapeHtml(title)}" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
        </div>
        <div class="form-group">
          <label>\${this.t('label.question_content', 'Question Content')}</label>
          <textarea id="modalQuestionContent" rows="5" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px; font-family: inherit;">\${this.escapeHtml(content)}</textarea>
        </div>
        <div class="modal-actions">
          <button onclick="this.closest('.modal-overlay').remove()" class="admin-btn" style="background: var(--border);">\${this.t('button.cancel', 'Cancel')}</button>
          <button onclick="app.saveEditQuestion(\${id}, this.closest('.modal-overlay'))" class="admin-btn">\${this.t('button.save_changes', 'Save Changes')}</button>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);
  }

  async saveEditQuestion(id, modal) {
    const newTitle = document.getElementById('modalQuestionTitle').value;
    const newContent = document.getElementById('modalQuestionContent').value;

    if (!newTitle || !newContent) return;

    try {
      const response = await fetch(\`/api/admin/questions/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
        credentials: 'include'
      });

      if (response.ok) {
        modal.remove();
        this.showAdmin();
      } else {
        const data = await response.json();
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.update_question', 'Soru güncellenemedi') + ': ' + error.message);
    }
  }

  async deleteQuestion(id) {
    // Double confirmation for deletion
    if (!confirm(this.t('confirm.delete_question', 'Bu soruyu ve tüm cevaplarını silmek istediğinizden emin misiniz?'))) return;
    if (!confirm(this.t('confirm.delete_question_final', 'SON UYARI: Bu işlem geri alınamaz! Devam etmek istediğinizden EMİN misiniz?'))) return;

    try {
      const response = await fetch(\`/api/admin/questions/\${id}\`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        this.showAdmin();
      } else {
        const data = await response.json();
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.delete_question', 'Soru silinemedi') + ': ' + error.message);
    }
  }

  editAnswerById(button) {
    const id = button.dataset.id;
    const content = button.dataset.content;
    this.showEditAnswerModal(id, content);
  }

  async loadAndEditAnswer(id) {
    try {
      const response = await fetch(\`/api/admin/answers/\${id}\`);
      const data = await response.json();
      if (data.answer) {
        this.showEditAnswerModal(id, data.answer.content);
      }
    } catch (error) {
      alert(this.t('error.load_answer', 'Failed to load answer'));
    }
  }

  showEditAnswerModal(id, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = \`
      <div class="modal">
        <h3>\${this.t('modal.edit_answer', 'Edit Answer')}</h3>
        <div class="form-group">
          <label>\${this.t('label.answer_content', 'Answer Content')}</label>
          <textarea id="modalAnswerContent" rows="6" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px; font-family: inherit;">\${this.escapeHtml(content)}</textarea>
        </div>
        <div class="modal-actions">
          <button onclick="this.closest('.modal-overlay').remove()" class="admin-btn" style="background: var(--border);">\${this.t('button.cancel', 'Cancel')}</button>
          <button onclick="app.saveEditAnswer(\${id}, this.closest('.modal-overlay'))" class="admin-btn">\${this.t('button.save_changes', 'Save Changes')}</button>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);
  }

  async saveEditAnswer(id, modal) {
    const newContent = document.getElementById('modalAnswerContent').value;

    if (!newContent) return;

    try {
      const response = await fetch(\`/api/admin/answers/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
        credentials: 'include'
      });

      if (response.ok) {
        modal.remove();
        this.showAdmin();
      } else {
        const data = await response.json();
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.update_answer', 'Cevap güncellenemedi') + ': ' + error.message);
    }
  }

  async deleteAnswer(id) {
    // Double confirmation for deletion
    if (!confirm(this.t('confirm.delete_answer', 'Bu cevabı silmek istediğinizden emin misiniz?'))) return;
    if (!confirm(this.t('confirm.delete_answer_final', 'SON UYARI: Bu işlem geri alınamaz! Devam etmek istediğinizden EMİN misiniz?'))) return;

    try {
      const response = await fetch(\`/api/admin/answers/\${id}\`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        this.showAdmin();
      } else {
        const data = await response.json();
        alert(this.t('error.generic', 'Hata') + ': ' + data.error);
      }
    } catch (error) {
      alert(this.t('error.delete_answer', 'Cevap silinemedi') + ': ' + error.message);
    }
  }

  showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = \`
      <div class="modal">
        <h3>\${this.t('modal.add_user', 'Add New User')}</h3>
        <div id="addUserMessage"></div>
        <form id="addUserForm">
          <div class="form-group">
            <label>\${this.t('label.username', 'Username')}</label>
            <input type="text" id="newUsername" required style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
          </div>
          <div class="form-group">
            <label>\${this.t('label.email', 'Email')}</label>
            <input type="email" id="newEmail" required style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
          </div>
          <div class="form-group">
            <label>\${this.t('label.name', 'Name')} (\${this.t('label.optional', 'Optional')})</label>
            <input type="text" id="newName" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
          </div>
          <div class="form-group">
            <label>\${this.t('label.role', 'Role')}</label>
            <select id="newRole" style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="admin-btn" style="background: var(--border);">\${this.t('button.cancel', 'Cancel')}</button>
            <button type="submit" class="admin-btn admin-btn-success">\${this.t('button.create_user', 'Create User')}</button>
          </div>
        </form>
      </div>
    \`;
    document.body.appendChild(modal);

    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAddUser(modal);
    });
  }

  async handleAddUser(modal) {
    const messageEl = document.getElementById('addUserMessage');
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const name = document.getElementById('newName').value;
    const role = document.getElementById('newRole').value;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, name: name || null, role }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(\`User created successfully!\\n\\nUsername: \${username}\\nPassword: \${data.password}\\n\\nPlease save this password - it won't be shown again.\`);
        modal.remove();
        this.showAdmin();
      } else {
        messageEl.innerHTML = '<div class="error-message">' + this.escapeHtml(data.error) + '</div>';
      }
    } catch (error) {
      messageEl.innerHTML = '<div class="error-message">' + this.t('error.create_user', 'Failed to create user') + ': ' + this.escapeHtml(error.message) + '</div>';
    }
  }

  async changeQuestionAuthor(questionId, currentUsername) {
    await this.showChangeAuthorModal('question', questionId, currentUsername);
  }

  async changeAnswerAuthor(answerId, currentUsername) {
    await this.showChangeAuthorModal('answer', answerId, currentUsername);
  }

  async showChangeAuthorModal(type, itemId, currentUsername) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = \`
      <div class="modal">
        <h3>\${this.t('modal.change_author', 'Change Author')}</h3>
        <div style="margin-bottom: 16px; color: #57606a;">
          \${this.t('label.current_author', 'Current author')}: <strong>\${this.escapeHtml(currentUsername)}</strong>
        </div>
        <div id="changeAuthorMessage"></div>
        <div class="form-group">
          <label>\${this.t('label.search_username', 'Search username')}</label>
          <input 
            type="text" 
            id="usernameSearch" 
            placeholder="\${this.t('placeholder.type_to_search', 'Type to search...')}"
            autocomplete="off"
            style="width: 100%; padding: 12px; background: #fff; border: 1px solid #d0d7de; color: #24292f; font-size: 14px;">
          <div id="userSearchResults" style="max-height: 200px; overflow-y: auto; border: 1px solid #d0d7de; margin-top: 8px; display: none;"></div>
        </div>
        <div class="modal-actions">
          <button type="button" onclick="this.closest('.modal-overlay').remove()" class="admin-btn" style="background: var(--border);">\${this.t('button.cancel', 'Cancel')}</button>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);

    let allUsers = [];
    let selectedUsername = null;

    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await response.json();
      allUsers = data.users || [];
    } catch (error) {
      document.getElementById('changeAuthorMessage').innerHTML = 
        '<div class="error-message">' + this.t('error.load_users', 'Failed to load users') + '</div>';
    }

    const searchInput = document.getElementById('usernameSearch');
    const resultsDiv = document.getElementById('userSearchResults');

    const filterUsers = (searchTerm) => {
      const filtered = allUsers.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
        u.username !== currentUsername
      );

      if (filtered.length === 0) {
        resultsDiv.style.display = 'none';
        return;
      }

      resultsDiv.innerHTML = filtered.map(u => \`
        <div class="user-search-item" data-username="\${this.escapeHtml(u.username)}" style="
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #d0d7de;
          background: #fff;
          transition: background 0.2s;
        " onmouseover="this.style.background='#f6f8fa'" onmouseout="this.style.background='#fff'">
          <strong>\${this.escapeHtml(u.username)}</strong>
          \${u.name ? \` - \${this.escapeHtml(u.name)}\` : ''}
          <span style="color: #57606a; margin-left: 8px;">(\${u.email})</span>
        </div>
      \`).join('');
      resultsDiv.style.display = 'block';
    };

    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm.length > 0) {
        filterUsers(searchTerm);
      } else {
        resultsDiv.style.display = 'none';
      }
    });

    resultsDiv.addEventListener('click', async (e) => {
      const item = e.target.closest('.user-search-item');
      if (!item) return;

      selectedUsername = item.dataset.username;
      
      if (selectedUsername === currentUsername) {
        document.getElementById('changeAuthorMessage').innerHTML = 
          '<div class="error-message">' + this.t('error.same_author', 'Same author selected') + '</div>';
        return;
      }

      const messageEl = document.getElementById('changeAuthorMessage');
      messageEl.innerHTML = '<div style="color: #0969da;">' + this.t('message.changing_author', 'Changing author...') + '</div>';

      try {
        const endpoint = type === 'question' 
          ? \`/api/admin/questions/\${itemId}/author\`
          : \`/api/admin/answers/\${itemId}/author\`;

        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: selectedUsername }),
          credentials: 'include'
        });

        const data = await response.json();
        
        if (response.ok) {
          modal.remove();
          this.showAdmin();
        } else {
          messageEl.innerHTML = '<div class="error-message">' + this.escapeHtml(data.error) + '</div>';
        }
      } catch (error) {
        messageEl.innerHTML = '<div class="error-message">' + this.t('error.change_author', 'Failed to change author') + ': ' + this.escapeHtml(error.message) + '</div>';
      }
    });
  }
}

const app = new App();`;
