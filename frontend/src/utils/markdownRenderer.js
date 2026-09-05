import { marked } from 'marked';

// Configure marked with default GitHub Flavored Markdown and line breaks
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Parses and formats AI interview prep explanations into clean, rich HTML.
 * Eliminates raw markdown characters (***, ###, ```) and renders high-end cards, badges, and code blocks.
 */
export function formatInterviewExplanation(rawText) {
  if (!rawText) return '';

  let text = String(rawText).trim();

  // 1. Normalize line breaks (handle <br />, <br>, escaped \n)
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/\\n/g, '\n');

  // 2. Format math expressions: $P(Y|X)$ -> `P(Y|X)`
  text = text.replace(/\$([^$\n]+)\$/g, (_, formula) => `\`${formula.trim()}\``);

  // 3. Highlight STAR interview method sections
  text = text.replace(/(?:^|\n)\s*(?:\*\*)?Situation:\s*(?:\*\*)?/gi, '\n\n**[STAR:Situation]** ');
  text = text.replace(/(?:^|\n)\s*(?:\*\*)?Task:\s*(?:\*\*)?/gi, '\n\n**[STAR:Task]** ');
  text = text.replace(/(?:^|\n)\s*(?:\*\*)?Action:\s*(?:\*\*)?/gi, '\n\n**[STAR:Action]** ');
  text = text.replace(/(?:^|\n)\s*(?:\*\*)?Result:\s*(?:\*\*)?/gi, '\n\n**[STAR:Result]** ');

  // 4. Parse markdown using marked
  let html = marked.parse(text);

  // 5. Replace STAR markers with vibrant, sleek UI badges
  const starBadges = {
    Situation: '<span class="inline-flex items-center gap-1 px-2 py-0.5 mr-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">S &bull; Situation</span>',
    Task: '<span class="inline-flex items-center gap-1 px-2 py-0.5 mr-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs">T &bull; Task</span>',
    Action: '<span class="inline-flex items-center gap-1 px-2 py-0.5 mr-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 shadow-xs">A &bull; Action</span>',
    Result: '<span class="inline-flex items-center gap-1 px-2 py-0.5 mr-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 shadow-xs">R &bull; Result</span>',
  };

  html = html.replace(/<strong>\[STAR:(Situation|Task|Action|Result)\]<\/strong>/g, (m, key) => starBadges[key] || m);

  // 6. Enhance h1-h4 headings into modern visual section divider headers
  html = html.replace(/<h([1-4])>(.*?)<\/h\1>/gi, (match, level, headingText) => {
    let badgeText = 'Section';
    let badgeColor = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

    if (/summary/i.test(headingText)) {
      badgeText = 'Summary';
      badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else if (/step|breakdown/i.test(headingText)) {
      badgeText = 'Step-by-Step';
      badgeColor = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    } else if (/code/i.test(headingText)) {
      badgeText = 'Code Snippet';
      badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (/star/i.test(headingText)) {
      badgeText = 'STAR Method';
      badgeColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }

    const cleanTitle = headingText.replace(/^\d+[\)\.]\s*/, '').replace(/<\/?strong>/gi, '');

    return `
      <div class="ai-section-header mt-4 mb-2 flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-1.5 first:mt-1">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-3.5 rounded-full bg-amber-500/90"></span>
          <h4 class="text-[13px] md:text-[14px] font-bold text-[var(--text-main)] tracking-tight m-0 p-0">${cleanTitle}</h4>
        </div>
        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badgeColor}">${badgeText}</span>
      </div>
    `;
  });

  return html;
}

/**
 * General markdown renderer for other answers or text snippets.
 */
export function renderGeneralMarkdown(rawText) {
  if (!rawText) return '';
  let text = String(rawText).trim();
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/\\n/g, '\n');
  return marked.parse(text);
}
