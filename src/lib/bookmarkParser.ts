// Utility functions for parsing and exporting browser bookmarks
import { z } from 'zod';

export interface ParsedBookmark {
  title: string;
  url: string;
  description?: string;
  tags: string[];
  category?: string;
}

// Security: Validation schema for imported bookmarks
const bookmarkSchema = z.object({
  title: z.string().trim().min(1).max(500),
  url: z.string().trim().url().max(2000).refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: 'URL must use http or https protocol' }
  ),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20),
  category: z.string().max(100).optional(),
});

// Security: Sanitize and validate a single bookmark
const sanitizeBookmark = (raw: {
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
  category?: string;
}): ParsedBookmark | null => {
  try {
    const validated = bookmarkSchema.parse(raw);
    return {
      title: validated.title,
      url: validated.url,
      description: validated.description,
      tags: validated.tags,
      category: validated.category,
    };
  } catch {
    // Skip invalid bookmarks
    return null;
  }
};

/**
 * Parse Chrome/Firefox bookmark HTML file
 */
export const parseBookmarkHTML = (htmlContent: string): ParsedBookmark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const bookmarks: ParsedBookmark[] = [];
  
  const processNode = (node: Element, folderPath: string[] = []) => {
    const items = node.children;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.tagName === 'DT') {
        const link = item.querySelector('a');
        const folder = item.querySelector('h3');
        
        if (link) {
          const url = link.getAttribute('href');
          const title = link.textContent?.trim();
          const addDate = link.getAttribute('add_date');
          
          if (url && title) {
            // Security: Sanitize and validate before adding
            const sanitized = sanitizeBookmark({
              title,
              url,
              description: addDate ? `Imported on ${new Date(parseInt(addDate) * 1000).toLocaleDateString()}` : undefined,
              tags: folderPath.length > 0 ? [folderPath[folderPath.length - 1].toLowerCase().substring(0, 50)] : [],
              category: folderPath.length > 0 ? folderPath[folderPath.length - 1].substring(0, 100) : 'Imported',
            });
            
            if (sanitized) {
              bookmarks.push(sanitized);
            }
          }
        }
        
        if (folder) {
          const folderName = folder.textContent?.trim() || 'Uncategorized';
          const dl = item.querySelector('dl');
          if (dl) {
            processNode(dl, [...folderPath, folderName]);
          }
        }
      }
    }
  };
  
  const dl = doc.querySelector('dl');
  if (dl) {
    processNode(dl);
  }
  
  return bookmarks;
};

/**
 * Export bookmarks to Chrome/Firefox compatible HTML format
 */
export const exportToHTML = (bookmarks: ParsedBookmark[]): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Group by category
  const categorized = bookmarks.reduce((acc, bookmark) => {
    const cat = bookmark.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(bookmark);
    return acc;
  }, {} as Record<string, ParsedBookmark[]>);
  
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">BookmarkHub Export</H3>
    <DL><p>
`;

  Object.entries(categorized).forEach(([category, items]) => {
    html += `        <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${category}</H3>\n`;
    html += `        <DL><p>\n`;
    
    items.forEach(bookmark => {
      html += `            <DT><A HREF="${bookmark.url}" ADD_DATE="${timestamp}">${bookmark.title}</A>\n`;
    });
    
    html += `        </DL><p>\n`;
  });

  html += `    </DL><p>
</DL><p>`;

  return html;
};

/**
 * Export bookmarks to JSON format
 */
export const exportToJSON = (bookmarks: any[]): string => {
  return JSON.stringify(bookmarks, null, 2);
};

/**
 * Download file helper
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
