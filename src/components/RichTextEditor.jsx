import { useRef, useEffect } from 'react';

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const initialValueSet = useRef(false);

  useEffect(() => {
    if (editorRef.current && value && !initialValueSet.current) {
      editorRef.current.innerHTML = value;
      initialValueSet.current = true;
    }
  }, [value]);

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    setTimeout(() => handleInput(), 10);
  };

  const insertList = (listTag) => {
    if (!editorRef.current) return;
    
    try {
      const sel = window.getSelection();
      
      // Eğer selection yoksa, editörün sonuna ekle
      if (!sel.rangeCount) {
        const list = document.createElement(listTag);
        const li = document.createElement('li');
        li.innerHTML = '<br>';
        list.appendChild(li);
        editorRef.current.appendChild(list);
        
        const range = document.createRange();
        range.setStart(li, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        
        handleInput();
        return;
      }
      
      const range = sel.getRangeAt(0);
      const selectedContent = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(selectedContent);
      
      let html = tempDiv.innerHTML.trim();
      
      // Alt alta metinleri algıla: <br>, <div>, <p> taglerini newline'a çevir
      html = html.replace(/<br\s*\/?>/gi, '\n');
      html = html.replace(/<\/div>/gi, '\n');
      html = html.replace(/<div[^>]*>/gi, '');
      html = html.replace(/<\/p>/gi, '\n');
      html = html.replace(/<p[^>]*>/gi, '');
      
      // Satırları ayır
      const lines = html.split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== '');
      
      const list = document.createElement(listTag);
      
      if (lines.length > 0) {
        // Her satır için liste öğesi
        lines.forEach(line => {
          const li = document.createElement('li');
          // HTML içeriğini koru (renkler, bold vb.)
          const lineDiv = document.createElement('div');
          lineDiv.innerHTML = line;
          li.innerHTML = lineDiv.innerHTML || '<br>';
          list.appendChild(li);
        });
      } else {
        // Boş veya tek satır
        const li = document.createElement('li');
        li.innerHTML = html || '<br>';
        list.appendChild(li);
      }
      
      range.deleteContents();
      range.insertNode(list);
      
      const br = document.createElement('br');
      if (list.nextSibling) {
        list.parentNode.insertBefore(br, list.nextSibling);
      } else {
        list.parentNode.appendChild(br);
      }
      
      const firstLi = list.querySelector('li');
      if (firstLi) {
        const newRange = document.createRange();
        newRange.selectNodeContents(firstLi);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      
      editorRef.current.focus();
      handleInput();
      
    } catch (error) {
      console.error('Liste ekleme hatası:', error);
    }
  };

  const insertCodeSnippet = () => {
    if (!editorRef.current) return;
    
    try {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      
      const range = sel.getRangeAt(0);
      const selectedText = range.toString();
      
      // Div kullanarak kod bloğu (pre yerine)
      const codeBlock = document.createElement('div');
      codeBlock.className = 'code-block';
      codeBlock.contentEditable = 'true';
      codeBlock.textContent = selectedText || '';
      
      // Boşsa başlangıç için <br> ekle (yazılabilir olması için)
      if (!selectedText) {
        codeBlock.innerHTML = '<br>';
      }
      
      // Seçili metni sil
      range.deleteContents();
      
      // Code bloğu ekle
      range.insertNode(codeBlock);
      
      // Sonrasına <br> ekle (çıkış için)
      const br1 = document.createElement('br');
      const br2 = document.createElement('br');
      
      if (codeBlock.nextSibling) {
        codeBlock.parentNode.insertBefore(br1, codeBlock.nextSibling);
        codeBlock.parentNode.insertBefore(br2, br1.nextSibling);
      } else {
        codeBlock.parentNode.appendChild(br1);
        codeBlock.parentNode.appendChild(br2);
      }
      
      // Cursor'u code bloğu içine koy
      const newRange = document.createRange();
      newRange.selectNodeContents(codeBlock);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
      
      editorRef.current.focus();
      handleInput();
      
    } catch (error) {
      console.error('Code snippet hatası:', error);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-100 p-2 border-b flex gap-2 flex-wrap">
        {/* Font Size */}
        <select
          onChange={(e) => {
            if (!editorRef.current) return;
            const size = e.target.value;
            editorRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
              document.execCommand('fontSize', false, size);
              setTimeout(() => handleInput(), 10);
            }
            e.target.value = "3";
          }}
          className="px-2 py-1 border rounded text-sm bg-white"
          defaultValue="3"
        >
          <option value="3" disabled>Boyut Seç</option>
          <option value="1">Küçük</option>
          <option value="3">Normal</option>
          <option value="5">Büyük</option>
          <option value="7">Çok Büyük</option>
        </select>

        {/* Bold, Italic, Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('bold');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 font-bold bg-white"
          title="Kalın"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('italic');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 italic bg-white"
          title="İtalik"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('underline');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 underline bg-white"
          title="Altı Çizili"
        >
          U
        </button>

        <div className="border-l mx-1"></div>

        {/* Text Color */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('foreColor', '#000000');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white"
          title="Siyah"
        >
          <span className="text-black font-bold">A</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('foreColor', '#DC2626');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white"
          title="Kırmızı"
        >
          <span className="text-red-600 font-bold">A</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('foreColor', '#16A34A');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white"
          title="Yeşil"
        >
          <span className="text-green-600 font-bold">A</span>
        </button>

        <div className="border-l mx-1"></div>

        {/* Background Color */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('backColor', '#FEF08A');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-yellow-200"
          title="Sarı Vurgu"
        >
          📝
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('backColor', 'transparent');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white"
          title="Vurguyu Kaldır"
        >
          ❌
        </button>

        <div className="border-l mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            insertList('ul');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white font-semibold"
          title="Madde İşaretli Liste (Alt alta metinleri seçin)"
        >
          • Liste
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            insertList('ol');
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white font-semibold"
          title="Numaralı Liste (Alt alta metinleri seçin)"
        >
          1. Liste
        </button>

        <div className="border-l mx-1"></div>

        {/* Code Snippet */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            insertCodeSnippet();
          }}
          className="px-3 py-1 border rounded hover:bg-gray-200 bg-white font-mono text-sm"
          title="Kod Snippet (Metni seçin)"
        >
          &lt;/&gt; Kod
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={(e) => {
          // Kod bloğu içinde Enter yakalandı mı kontrol et
          if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              let node = range.startContainer;
              
              // Parent node'ları kontrol et - kod bloğu içinde miyiz?
              let isInCodeBlock = false;
              let codeBlockElement = null;
              
              while (node && node !== editorRef.current) {
                if (node.classList && node.classList.contains('code-block')) {
                  isInCodeBlock = true;
                  codeBlockElement = node;
                  break;
                }
                node = node.parentNode;
              }
              
              // Kod bloğu içindeyse, Enter'ı manuel işle
              if (isInCodeBlock) {
                e.preventDefault();
                e.stopPropagation();
                
                // Manuel olarak <br> ekle
                const br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);
                range.setStartAfter(br);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                handleInput();
              }
            }
          }
        }}
        className="p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-200 editor-content"
        style={{ wordBreak: 'break-word' }}
        suppressContentEditableWarning
      />
    </div>
  );
}

export default RichTextEditor;
