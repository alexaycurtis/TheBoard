import React, {useState, useRef, useEffect} from 'react';
import {Plus, Type, Square, Circle, Image, Trash2, Copy, Lock, Unlock} from 'lucide-react';

/*popout editing panel elements, looked up a list*/
interface Element{
  id: string;
  type: 'text' | 'container' | 'image' | 'circle' | 'profile-card' | 'artwork-card' | 'search-pill' | 'info-card' | 'avatar' | 'feature-card' | 'stat-card' | 'tag-pill';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  backgroundColor?: string;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  padding?: number;
  locked?: boolean;
  zIndex?: number;
  isEditing?: boolean;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  iconType?: string;
}

const WhiteboardApp: React.FC = () =>{
  const GRID_SIZE = 20; //grid cell size in pixels

  /*many editing properties that I researched that I needed*/
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  //Snap to grid helper function- I want the elements to lock into a grid like google slides
  const snapToGrid = (value: number) =>{
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  useEffect(() => {
    if (editingId && textareaRef.current){
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingId]);

  useEffect(() =>{
    const handleKeyDown = (e: KeyboardEvent) =>{
      if(editingId) return; //Don't use shortcuts while editing, i saw this in a tutorial and it seems beneficial

      if(selectedId){
        const element = elements.find(el => el.id === selectedId);
        if(!element || element.locked) return;

        const step = e.shiftKey ? 10 : 1;

        /*keybinds for moving items around on the board*/
        switch (e.key){
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            deleteElement();
            break;
          case 'ArrowUp':
            e.preventDefault();
            updateElement(selectedId, { y: snapToGrid(element.y - step) });
            break;
          case 'ArrowDown':
            e.preventDefault();
            updateElement(selectedId, { y: snapToGrid(element.y + step) });
            break;
          case 'ArrowLeft':
            e.preventDefault();
            updateElement(selectedId, { x: snapToGrid(element.x - step) });
            break;
          case 'ArrowRight':
            e.preventDefault();
            updateElement(selectedId, { x: snapToGrid(element.x + step) });
            break;
          case 'd':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              duplicateElement();
            }
            break;
          case 'l':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              toggleLock();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, editingId]);

  /*textbox settings*/
  const addElement = (type: Element['type']) =>{
    let newElement: Element ={
      id: `element-${Date.now()}`,
      type,
      x: snapToGrid(100 + elements.length * 20),
      y: snapToGrid(100 + elements.length * 20),
      width: 300,
      height: 200,
      content: type === 'text' ? 'Double click to edit' : '',
      backgroundColor: 'transparent',
      borderRadius: 8,
      fontSize: 16,
      fontWeight: 'normal',
      textAlign: 'left',
      padding: 16,
      locked: false,
      zIndex: elements.length
    };

    //Customize based on type, different kinds of blocks
    switch(type){
      case 'text':
        newElement ={ ...newElement, width: 200, height: 50 };
        break;
      case 'circle':
        newElement ={ ...newElement, width: 150, height: 150, backgroundColor: '#e8d4c4', borderRadius: 50 };
        break;
      case 'container':
        newElement ={ ...newElement, backgroundColor: '#f5f5dc', borderRadius: 20 };
        break;
      case 'profile-card':
        newElement = {
          ...newElement,
          width: 900,
          height: 300,
          backgroundColor: '#f0f0f0',
          borderRadius: 24,
          title: 'Profile Name',
          subtitle: 'A brief description or tagline about this profile...',
          padding: 32
        };
        break;
      case 'artwork-card':
        newElement ={
          ...newElement,
          width: 180,
          height: 220,
          backgroundColor: '#d4a574',
          borderRadius: 16,
          content: 'by @creator'
        };
        break;
      case 'search-pill':
        newElement ={
          ...newElement,
          width: 200,
          height: 50,
          backgroundColor: '#e07856',
          borderRadius: 25,
          content: 'Search term',
          padding: 12,
          fontSize: 14
        };
        break;
      case 'info-card':
        newElement ={
          ...newElement,
          width: 250,
          height: 80,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          title: 'Card Title',
          subtitle: 'Additional information and details',
          padding: 16
        };
        break;
      case 'avatar':
        newElement ={
          ...newElement,
          width: 120,
          height: 120,
          backgroundColor: '#ffd4b8',
          borderRadius: 20
        };
        break;
      case 'feature-card':
        newElement ={
          ...newElement,
          width: 320,
          height: 180,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          title: 'Feature Title',
          subtitle: 'Feature description and benefits',
          padding: 24
        };
        break;
      case 'stat-card':
        newElement ={
          ...newElement,
          width: 200,
          height: 140,
          backgroundColor: '#e3f2fd',
          borderRadius: 16,
          title: '1,234',
          subtitle: 'Statistic Label',
          padding: 20
        };
        break;   
      case 'tag-pill':
        newElement ={
          ...newElement,
          width: 120,
          height: 36,
          backgroundColor: '#f3e5f5',
          borderRadius: 18,
          content: 'Tag',
          padding: 8,
          fontSize: 13
        };    
        break;   
    } /*i love switch cases*/    

    /*forgot to add this last commit*/
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
    if(type === 'text'){
      setTimeout(()=> setEditingId(newElement.id), 100);
    }
  };
    
  //click down on an element to start dragging it
  const handleMouseDown = (e: React.MouseEvent, id: string) =>{
    const element = elements.find(el => el.id === id);//identify element clicked on
    if(element?.locked || editingId === id) return; //don't move locked items or currently editing

    e.stopPropagation();
    setSelectedId(id);//set status to selected
    setDragging(id);
    const rect = e.currentTarget.getBoundingClientRect();///get the location of where element was clicked so it doesn't glitch around
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  //resize box
  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    const element = elements.find(el => el.id === id);
    if(element?.locked) return;

    e.stopPropagation();
    setResizing(id);//set status as resizing
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element?.width || 0,
      height: element?.height || 0
    });
  };

  /*Learned this from the documentation*/
  const handleMouseMove = (e: React.MouseEvent) =>{//while mouse is moving do
    if(dragging && canvasRef.current){
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;

      /*Learned this from a tutorial*/
      //updates the element position with grid snapping
      setElements(elements.map(el =>
        el.id === dragging
          ?{
              ...el,
              x: snapToGrid(newX),
              y: snapToGrid(newY)
            }
          :el
      ));
    } 
    else if (resizing){
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      //calculate new size
      const newWidth = Math.max(50, resizeStart.width + dx);
      const newHeight = Math.max(30, resizeStart.height + dy);

      //update size
      setElements(elements.map(el =>
        el.id === resizing
          ? {
              ...el,
              width: snapToGrid(newWidth),
              height: snapToGrid(newHeight)
            }
          : el
      ));
    }
  };

  //when let go of mouse, stop dragging/resizing
  const handleMouseUp = () =>{
    setDragging(null);
    setResizing(null);
  };

  //double click to edit non-locked text
  const handleDoubleClick = (id: string) =>{
    const element = elements.find(el => el.id === id);
    if(element?.type === 'text' && !element.locked){
      setEditingId(id);
    }
  };

  //typing inside textbox
  const handleTextChange = (id: string, value: string) =>{
    updateElement(id, { content: value });
  };

  //stop editing when click away from textbox
  const handleTextBlur = () =>{
    setEditingId(null);
  };

  /*From tutorial*/
  //When image is uploaded do
  const handleImageUpload = (id: string, file: File) =>{
    const reader = new FileReader();//use filereader
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      updateElement(id, { imageUrl });
    };
    reader.readAsDataURL(file);
  };
  
  /*Also from tutorial - func to update any property of an element*/
  const updateElement = (id: string, updates: Partial<Element>) =>{
    //for each element, implement updates
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };        

  //deletion
  const deleteElement = () =>{
    if(selectedId){
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
      setEditingId(null);
    }
  };

  //copy selected element
  const duplicateElement = () =>{
    if(selectedId){
      const element = elements.find(el => el.id === selectedId);
      if(element){
        //creation of new element w/ same properties
        const newElement = {
          ...element,
          id: `element-${Date.now()}`,
          x: element.x + 20,
          y: element.y + 20,
          zIndex: elements.length
        };
        setElements([...elements, newElement]);
        setSelectedId(newElement.id);
      }
    }
  };

  //locking for elements
  const toggleLock = () =>{
    if(selectedId){
      const element = elements.find(el => el.id === selectedId);
      updateElement(selectedId, {locked: !element?.locked });
    }
  };

  /*The following code for exporting the board as an image was dervied from tutorial videos and documentation*/
  //export whiteboard as png
  const downloadAsImage = async () => {
    //make transparent canvas to draw board onto
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;//to prevent bugs from failure

    //fixed size 
    canvas.width = 1920;
    canvas.height = 1080;

    //fill backgrund
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //draw grid
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
    ctx.lineWidth = 1;
    for(let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for(let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    //Helper function for rounded rectangles
    const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    //loop through each element to draw on canvas
    for (const el of elements) {
      ctx.save();

      //backgrounds
      if(el.backgroundColor && el.backgroundColor !== 'transparent') {
        ctx.fillStyle = el.backgroundColor;
        if(el.borderRadius && el.borderRadius > 0) {
          roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
          ctx.fill();
        } 
        else {
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
      }

      //text elements
      if(el.type === 'text' && el.content){
        ctx.fillStyle = '#333';
        ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 16}px sans-serif`;
        ctx.textAlign = (el.textAlign || 'left') as CanvasTextAlign;
        ctx.textBaseline = 'top';

        //place text according to position
        const padding = el.padding || 0;
        let textX = el.x + padding;
        if (el.textAlign === 'center') textX = el.x + el.width / 2;
        else if (el.textAlign === 'right') textX = el.x + el.width - padding;

        //draw text
        ctx.fillText(el.content, textX, el.y + padding);
      }

      //draw images
      if(el.type === 'image' && el.imageUrl){
        const img = new Image();
        img.src = el.imageUrl;
        await new Promise<void>((resolve) =>{
          img.onload = () => {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
            resolve();
          };
          img.onerror = () => resolve();
        });
      }

      ctx.restore();
    }

    //download
    canvas.toBlob((blob) => {
      if(blob){
        //temp download link creation
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whiteboard-1920x1080-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  //currently selected element
  const selectedElement = elements.find(el => el.id === selectedId);
  
