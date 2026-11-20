/**
 * KC Assist AI mode: answers staff "how do I…" questions with Claude, using only KCM help content.
 *
 * Off until you add a key:  Apps Script > Project Settings > Script Properties >
 *   ANTHROPIC_API_KEY = sk-ant-...           (from console.anthropic.com; never put it in the code or GitHub)
 *   ASSISTANT_MODEL   = claude-haiku-5-5     (optional; this is the default)
 * Without a key the dashboard uses its built-in, free keyword assistant instead.
 *
 * The browser sends the question plus the help articles it thinks are most relevant (so the prompt stays
 * small and cheap). The model must answer only from those articles and name the article it used.
 * Each staff member can ask up to 40 questions an hour. Questions are not stored.
 */
Object.assign(ACTIONS, {
  assistantAsk: b => {
    const user = requireUser_(b.token);
    if (!isStaff_(user)) throw userError_('Only KCM staff can use KC Assist.', 'forbidden');
    const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!key) return { mode: 'local' };
    const question = String(b.question || '').trim().slice(0, 500);
    if (!question) throw userError_('Please type a question.');
    const cache = CacheService.getScriptCache(), rk = 'kca:' + user.email, n = Number(cache.get(rk) || 0);
    if (n >= 40) throw userError_('You have asked a lot of questions this hour. Please try again a bit later.', 'rate');
    cache.put(rk, String(n + 1), 3600);
    const arts = (Array.isArray(b.articles) ? b.articles : []).slice(0, 8).map(a => ({
      id: String(a.id || '').slice(0, 40), title: String(a.title || '').slice(0, 120),
      who: String(a.who || '').slice(0, 120), text: String(a.text || '').slice(0, 1800) }));
    const titles = (Array.isArray(b.titles) ? b.titles : []).slice(0, 80).map(t => String(t).slice(0, 100));
    const role = roleOf_(user), name = String(user.name || '').split(' ')[0];
    const system = [
      'You are Kaycee, the dashboard assistant inside the KCM Travel & Tours staff dashboard (the KCM Operations Centre).',
      'Answer the employee\'s question using ONLY the help articles provided. Do not invent buttons, pages, rules or numbers.',
      'If the articles do not answer it, say you are not sure and suggest which of the listed topics to ask about.',
      'The employee\'s role is ' + role + '. If an article says only certain roles can do something and this role is not one of them, say so and say who can.',
      'Write in plain, friendly South African English. Be brief: one short sentence, then numbered steps if there are steps (max 6). Use the exact button and page names from the articles. No emojis, no markdown headings, no bold markers.',
      'Last line must be exactly: ARTICLE: <id of the article you used, or none>',
    ].join('\n');
    const content = 'Help articles:\n\n' + arts.map(a => `[${a.id}] ${a.title}${a.who ? ' (allowed: ' + a.who + ')' : ''}\n${a.text}`).join('\n\n') +
      '\n\nOther topics available: ' + titles.join('; ') + '\n\nEmployee (' + (name || 'staff') + ') asks: ' + question;
    const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: PropertiesService.getScriptProperties().getProperty('ASSISTANT_MODEL') || 'claude-haiku-5-5', max_tokens: 600, temperature: 0.2, system, messages: [{ role: 'user', content }] }),
    });
    const code = res.getResponseCode();
    if (code !== 200) { console.error('KC Assist AI error', code, res.getContentText().slice(0, 300)); return { mode: 'local', reason: 'ai_unavailable' }; }
    const out = JSON.parse(res.getContentText());
    let text = (out.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    const m = /\n?ARTICLE:\s*([a-z0-9-]+|none)\s*$/i.exec(text);
    const article = m && m[1].toLowerCase() !== 'none' ? m[1] : '';
    if (m) text = text.slice(0, m.index).trim();
    return { mode: 'ai', answer: text.slice(0, 3000), article };
  },
});
