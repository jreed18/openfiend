import { callNotionTool } from '../mcpClient';
import { getConfigValue } from '../setup';

/**
 * MIND SECTION - Read and customize Bob's root Notion page
 *
 * Bob can see and modify his own workspace layout - icons, covers, blocks.
 */

export async function customizeMind(action: string, data: Record<string, any> = {}): Promise<{ success: boolean; message: string }> {
  try {
    const rootPageId = getConfigValue('root_page_id');

    if (!rootPageId) {
      return { success: false, message: 'Notion root page is not configured.' };
    }

    switch (action) {
      case 'set_title': {
        const title = (data.title || '').trim();
        if (!title) return { success: false, message: 'Missing title.' };

        await callNotionTool('API-patch-page', {
          page_id: rootPageId,
          properties: {
            title: {
              title: [{ text: { content: title } }],
            },
          } as any,
        });

        return { success: true, message: 'Root page title updated.' };
      }

      case 'set_icon': {
        if (!data.icon) return { success: false, message: 'Missing icon.' };

        await callNotionTool('API-patch-page', {
          page_id: rootPageId,
          icon: typeof data.icon === 'string' ? { type: 'emoji', emoji: data.icon } : data.icon,
        });

        return { success: true, message: 'Root page icon updated.' };
      }

      case 'set_cover': {
        const cover = data.coverUrl || data.cover;
        if (!cover) return { success: false, message: 'Missing cover URL.' };

        await callNotionTool('API-patch-page', {
          page_id: rootPageId,
          cover: typeof cover === 'string' ? { type: 'external', external: { url: cover } } : cover,
        });

        return { success: true, message: 'Root page cover updated.' };
      }

      case 'append_blocks': {
        const blocks = Array.isArray(data.blocks) ? data.blocks : [];
        if (blocks.length === 0) return { success: false, message: 'No blocks provided.' };

        await callNotionTool('API-patch-block-children', {
          block_id: rootPageId,
          children: blocks,
        });

        return { success: true, message: `Appended ${blocks.length} block(s) to root page.` };
      }

      case 'apply_preset': {
        const preset = (data.preset || '').toLowerCase();

        if (preset === 'minimalist') {
          await callNotionTool('API-patch-page', {
            page_id: rootPageId,
            icon: { type: 'external', external: { url: 'https://www.notion.so/icons/brain_gray.svg' } },
            cover: { type: 'external', external: { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475' } },
          });

          await callNotionTool('API-patch-block-children', {
            block_id: rootPageId,
            children: [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: 'Mind' } }] },
              },
              {
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: 'Focused layout. Keep only what matters.' } }] },
              },
            ] as any,
          });

          return { success: true, message: 'Applied minimalist preset.' };
        }

        if (preset === 'detailed') {
          await callNotionTool('API-patch-page', {
            page_id: rootPageId,
            icon: { type: 'external', external: { url: 'https://www.notion.so/icons/book_gray.svg' } },
            cover: { type: 'external', external: { url: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32' } },
          });

          await callNotionTool('API-patch-block-children', {
            block_id: rootPageId,
            children: [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: 'Mind Dashboard' } }] },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Current priorities' } }] },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Recent insights' } }] },
              },
              {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'Open questions' } }] },
              },
            ] as any,
          });

          return { success: true, message: 'Applied detailed preset.' };
        }

        return { success: false, message: `Unknown preset: ${preset}` };
      }

      default:
        return { success: false, message: `Unknown action: ${action}` };
    }
  } catch (error: any) {
    console.error('[Notion] Failed to customize mind section:', error?.message || error);
    return { success: false, message: 'Failed to customize root page.' };
  }
}
