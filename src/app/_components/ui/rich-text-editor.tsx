import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Node } from '@tiptap/core';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import {
  LuBold,
  LuItalic,
  LuStrikethrough,
  LuCode,
  LuList,
  LuListOrdered,
  LuAlignLeft,
  LuAlignCenter,
  LuAlignRight,
  LuUndo,
  LuRedo,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuLink,
  LuImage,
  LuVideo,
} from 'react-icons/lu';

// 创建自定义的 Video 扩展
const Video = Node.create({
  name: 'video',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      style: {
        default: 'width: 100%; height: auto;',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;

          // 首先尝试从 video 标签本身获取 src
          let src = element.getAttribute('src');

          // 如果 video 标签没有 src，尝试从子元素 source 中获取
          if (!src) {
            const sourceElement = element.querySelector('source');
            src = sourceElement?.getAttribute('src') ?? null;
          }

          // 如果没有找到 src，返回 null（Tiptap会忽略这个节点）
          if (!src) {
            return null;
          }

          return {
            src,
            controls: element.getAttribute('controls') !== null,
            style: element.getAttribute('style') || 'width: 100%; height: auto;',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, controls, style } = HTMLAttributes;
    if (!src) return ['div', {}, ''];

    return [
      'video',
      {
        src,
        controls: controls !== false,
        style: style || 'width: 100%; height: auto;',
      },
    ];
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onUploadFile?: (file: File) => Promise<string>; // 返回上传后的文件URL
}

const MenuBar = ({ editor, onUploadFile }: { editor: any; onUploadFile?: (file: File) => Promise<string> }) => {
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // 检查文件大小（限制为 5MB）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('图片文件过大，请选择小于 5MB 的图片文件');
        event.target.value = '';
        return;
      }

      setUploading(true);
      try {
        if (onUploadFile) {
          // 使用自定义上传函数
          const url = await onUploadFile(file);
          editor.chain().focus().setImage({ src: url }).run();
        } else {
          // 降级方案：使用 Base64（仅用于小图片或开发测试）
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            editor.chain().focus().setImage({ src: base64String }).run();
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        alert('图片上传失败，请重试');
      } finally {
        setUploading(false);
      }
    }
    // Reset input
    event.target.value = '';
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // 检查文件大小（限制为 50MB）
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('视频文件过大，请选择小于 50MB 的视频文件');
        event.target.value = '';
        return;
      }

      setUploading(true);
      try {
        if (onUploadFile) {
          // 使用自定义上传函数
          const url = await onUploadFile(file);

          // 插入视频节点
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'video',
              attrs: {
                src: url,
                controls: true,
                style: 'width: 100%; height: auto;',
              },
            })
            .run();
        } else {
          // 降级方案：使用 Base64（不推荐用于视频）
          alert('请配置文件上传功能以支持视频上传');
        }
      } catch (error) {
        console.error('视频上传失败:', error);
        alert('视频上传失败，请重试');
      } finally {
        setUploading(false);
      }
    }
    // Reset input
    event.target.value = '';
  };

  const buttonStyle = {
    minW: '32px',
    h: '32px',
    fontSize: '16px',
    color: '#4E5969',
    bg: 'transparent',
    _hover: { bg: '#E5E6EB' },
  };

  const activeStyle = {
    ...buttonStyle,
    bg: '#E5E6EB',
    color: '#E31424',
  };

  return (
    <Flex
      gap={1}
      p={2}
      borderBottom="1px solid #E5E6EB"
      bg="#F2F3F5"
      borderTopRadius="4px"
      flexWrap="wrap"
    >
      <IconButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
        {...(editor.isActive('bold') ? activeStyle : buttonStyle)}
      >
        <LuBold />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
        {...(editor.isActive('italic') ? activeStyle : buttonStyle)}
      >
        <LuItalic />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strike"
        {...(editor.isActive('strike') ? activeStyle : buttonStyle)}
      >
        <LuStrikethrough />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        aria-label="Code"
        {...(editor.isActive('code') ? activeStyle : buttonStyle)}
      >
        <LuCode />
      </IconButton>

      <Box w="1px" h="32px" bg="#E5E6EB" mx={1} />

      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Heading 1"
        {...(editor.isActive('heading', { level: 1 }) ? activeStyle : buttonStyle)}
      >
        <LuHeading1 />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading 2"
        {...(editor.isActive('heading', { level: 2 }) ? activeStyle : buttonStyle)}
      >
        <LuHeading2 />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Heading 3"
        {...(editor.isActive('heading', { level: 3 }) ? activeStyle : buttonStyle)}
      >
        <LuHeading3 />
      </IconButton>

      <Box w="1px" h="32px" bg="#E5E6EB" mx={1} />

      <IconButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
        {...(editor.isActive('bulletList') ? activeStyle : buttonStyle)}
      >
        <LuList />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
        {...(editor.isActive('orderedList') ? activeStyle : buttonStyle)}
      >
        <LuListOrdered />
      </IconButton>

      <Box w="1px" h="32px" bg="#E5E6EB" mx={1} />

      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label="Align Left"
        {...(editor.isActive({ textAlign: 'left' }) ? activeStyle : buttonStyle)}
      >
        <LuAlignLeft />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label="Align Center"
        {...(editor.isActive({ textAlign: 'center' }) ? activeStyle : buttonStyle)}
      >
        <LuAlignCenter />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label="Align Right"
        {...(editor.isActive({ textAlign: 'right' }) ? activeStyle : buttonStyle)}
      >
        <LuAlignRight />
      </IconButton>

      <Box w="1px" h="32px" bg="#E5E6EB" mx={1} />

      <IconButton
        onClick={() => {
          const url = window.prompt('输入链接URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        aria-label="Link"
        {...(editor.isActive('link') ? activeStyle : buttonStyle)}
      >
        <LuLink />
      </IconButton>

      <IconButton
        onClick={() => imageInputRef.current?.click()}
        aria-label="Upload Image"
        disabled={uploading}
        {...buttonStyle}
        opacity={uploading ? 0.5 : 1}
      >
        <LuImage />
      </IconButton>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <IconButton
        onClick={() => videoInputRef.current?.click()}
        aria-label="Upload Video"
        disabled={uploading}
        {...buttonStyle}
        opacity={uploading ? 0.5 : 1}
      >
        <LuVideo />
      </IconButton>

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />

      {uploading && (
        <Box ml={2} fontSize="12px" color="#86909C">
          上传中...
        </Box>
      )}

      <Box w="1px" h="32px" bg="#E5E6EB" mx={1} />

      <IconButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
        {...buttonStyle}
      >
        <LuUndo />
      </IconButton>

      <IconButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
        {...buttonStyle}
      >
        <LuRedo />
      </IconButton>
    </Flex>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入内容',
  minHeight = '300px',
  onUploadFile,
}) => {
  // 使用 ref 追踪上一次的 value，避免不必要的更新
  const lastValueRef = React.useRef<string>('');
  const isInitializedRef = React.useRef<boolean>(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
        validate: (href) => /^https?:\/\//.test(href) || /^\//.test(href),
      }),
      Image.configure({
        inline: true,
        allowBase64: true, // 明确允许 Base64 图片
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      Video, // 添加 Video 扩展支持
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      lastValueRef.current = newContent;
      onChange(newContent);
    },
    onCreate: ({ editor }) => {
      isInitializedRef.current = true;
      // 不要在这里设置 lastValueRef，让 useEffect 处理
      console.log('富文本编辑器已初始化:', {
        initialContentLength: (value || '').length,
        hasContent: !!(value || '').trim(),
        hasVideos: (value || '').includes('<video'),
      });
    },
    onDestroy: () => {
      isInitializedRef.current = false;
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
    immediatelyRender: false,
  });

  // 当外部 value 变化时，同步到编辑器
  React.useEffect(() => {
    if (!editor || editor.isDestroyed || !isInitializedRef.current) {
      console.log('富文本编辑器跳过同步:', {
        hasEditor: !!editor,
        isDestroyed: editor?.isDestroyed,
        isInitialized: isInitializedRef.current,
      });
      return;
    }

    // 获取当前编辑器内容
    const currentContent = editor.getHTML();

    // 标准化内容用于比较（移除空段落差异）
    const normalizeContent = (html: string) => {
      if (!html || html.trim() === '' || html === '<p></p>') return '';
      return html;
    };

    const normalizedValue = normalizeContent(value);
    const normalizedCurrent = normalizeContent(currentContent);

    console.log('富文本编辑器同步检查:', {
      valueLength: value?.length,
      currentLength: currentContent?.length,
      normalizedValueLength: normalizedValue.length,
      normalizedCurrentLength: normalizedCurrent.length,
      lastValueLength: lastValueRef.current?.length,
      valueEqualsLast: value === lastValueRef.current,
      normalizedEqual: normalizedValue === normalizedCurrent,
    });

    // 如果 value 与上次相同，说明是编辑器自己的更新，不需要再设置
    if (value === lastValueRef.current) {
      console.log('富文本编辑器内容未变化，跳过同步');
      return;
    }

    // 只有当内容真正不同时才更新编辑器
    if (normalizedValue !== normalizedCurrent) {
      console.log('富文本编辑器内容同步:', {
        valueLength: value?.length,
        currentLength: currentContent?.length,
        normalizedValueLength: normalizedValue.length,
        normalizedCurrentLength: normalizedCurrent.length,
        willUpdate: true,
        hasImages: value?.includes('<img'),
        hasVideos: value?.includes('<video'),
        valuePreview: value?.substring(0, 100),
      });

      try {
        // 更新内容，不触发 onUpdate 回调
        editor.commands.setContent(value || '', { emitUpdate: false });

        // 更新 ref
        lastValueRef.current = value || '';

        console.log('内容更新完成:', {
          newContentLength: editor.getHTML().length,
          hasImages: editor.getHTML().includes('<img'),
          hasVideos: editor.getHTML().includes('<video'),
        });
      } catch (error) {
        console.error('富文本编辑器设置内容失败:', error);
        // 如果设置失败，尝试清空编辑器并设置为空内容
        try {
          editor.commands.clearContent();
          lastValueRef.current = '';
        } catch (clearError) {
          console.error('清空编辑器内容失败:', clearError);
        }
      }
    } else {
      console.log('富文本编辑器标准化内容相同，跳过同步');
    }
  }, [value, editor]);

  return (
    <Box
      border="1px solid #E5E6EB"
      borderRadius="4px"
      css={{
        '& .tiptap-editor': {
          minHeight: minHeight,
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.6',
          outline: 'none',
          '&:focus': {
            outline: 'none',
          },
          '& p': {
            margin: '0.5em 0',
          },
          '& h1': {
            fontSize: '2em',
            fontWeight: 'bold',
            margin: '0.67em 0',
          },
          '& h2': {
            fontSize: '1.5em',
            fontWeight: 'bold',
            margin: '0.75em 0',
          },
          '& h3': {
            fontSize: '1.17em',
            fontWeight: 'bold',
            margin: '0.83em 0',
          },
          '& ul, & ol': {
            paddingLeft: '2em',
            margin: '0.5em 0',
          },
          '& img, & .tiptap-image': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '1em 0',
            borderRadius: '4px',
          },
          '& video': {
            width: '100%',
            height: 'auto',
            display: 'block',
            margin: '1em 0',
            borderRadius: '4px',
            backgroundColor: '#000',
          },
          '& source': {
            display: 'none', // 隐藏 source 标签，避免显示文本
          },
          '& a': {
            color: '#E31424',
            textDecoration: 'underline',
          },
          '& code': {
            backgroundColor: '#F2F3F5',
            padding: '2px 4px',
            borderRadius: '2px',
            fontSize: '0.9em',
          },
        },
        '& .ProseMirror p.is-editor-empty:first-of-type::before': {
          content: `"${placeholder}"`,
          color: '#86909C',
          pointerEvents: 'none',
          height: '0',
          float: 'left',
        },
      }}
    >
      <MenuBar editor={editor} onUploadFile={onUploadFile} />
      <EditorContent editor={editor} />
    </Box>
  );
};

export default RichTextEditor;
