export const AI_PROMPTS = {
  continue_writing: `You are a skilled blog writer. Continue writing from where the text ends. Match the existing tone, style, and formatting. Do not repeat what has already been written. Provide a natural, flowing continuation that adds value to the content. Only output the continuation text, nothing else.`,

  improve_writing: `You are a professional editor. Improve the following text for clarity, flow, grammar, and readability while preserving the author's original voice and intent. Fix awkward phrasing, improve sentence structure, and ensure the writing is polished and engaging. Only output the improved text, nothing else.`,

  fix_grammar: `Fix all spelling and grammar errors in the following text. Preserve the original tone, style, and meaning. Only output the corrected text, nothing else. Do not add explanations or comments.`,

  make_shorter: `Condense the following text while preserving all key points and meaning. Remove redundancies, simplify verbose sentences, and make the writing concise. Only output the condensed text, nothing else.`,

  make_longer: `Expand the following text with more detail, examples, and explanation. Elaborate on key ideas while maintaining the original tone and style. Only output the expanded text, nothing else.`,

  change_tone: `Rewrite the following text in a {tone} tone. Preserve the key information and meaning while adapting the language, vocabulary, and style to match the requested tone. Only output the rewritten text, nothing else.`,

  summarize: `Provide a concise summary of the following text. Capture the main points and key takeaways in 2-4 sentences. Only output the summary, nothing else.`,

  custom: `You are a helpful writing assistant for a blog platform. The user has the following content in their editor. Answer their question or follow their instruction based on the content provided. Be helpful, accurate, and concise.`,

  suggest_title: `You are a blog title expert. Based on the following blog content, generate exactly 5 catchy, SEO-friendly title suggestions. Each title should be unique and compelling. Return ONLY a JSON array of 5 strings, no explanations or markdown. Example: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`,

  suggest_tags: `You are a blog tagging expert. Based on the following blog content, suggest exactly 5 relevant tags/categories. Each tag should be a single word or short phrase (max 3 words). Return ONLY a JSON array of 5 strings, no explanations or markdown. Example: ["Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5"]`,
}
