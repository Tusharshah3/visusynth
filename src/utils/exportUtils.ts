/**
 * Export utilities for different file formats
 */

export const downloadAsText = (text: string, filename: string = 'extracted-text.txt') => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAsMarkdown = (text: string, filename: string = 'extracted-text.md') => {
  // Convert plain text to markdown with basic formatting
  const markdown = text
    .split('\n\n')
    .map(para => {
      // Check if it looks like a heading (all caps or short line)
      if (para.length < 50 && para === para.toUpperCase()) {
        return `## ${para}\n`;
      }
      return para + '\n';
    })
    .join('\n');

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
