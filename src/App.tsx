import React, {useState, useRef, useEffect} from 'react';
import { Plus, Type, Square, Circle, Image, Trash2, Copy, Lock, Unlock} from ' lucide-react ';
import './App.css';

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

const App: React.FC = () =>{
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
        newElement ={ ...newElement, width: 200, height: 55 };
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
      case 'search-pill': //this used to be a search bar element, but I decided to make it a title box without changing the name
        newElement ={
          ...newElement,
          width: 200,                        
          height: 50,      
          backgroundColor: '#e07856',
          borderRadius: 25,
          content: 'Title Text',
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
          title: 'Title',
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
          subtitle: 'Number Label',
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
          content: 'Text',
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
  return(
  /*Typed CSS for the block elements*/

   <div className="w-full h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex">
      {/*added side bar*/}
      <div className="w-20 bg-slate-900/50 backdrop-blur border-r border-slate-700 flex flex-col items-center py-6 gap-3 overflow-y-auto">
        {/*basic buttons*/}
        <div className="text-slate-400 text-xs mb-2">Basic</div>
        <button
          onClick={() => addElement('text')}
          className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Text"
        >
          <Type className="w-5 h-5 text-slate-200" />
        </button>
        <button
          onClick={() => addElement('container')}
          className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Container"
        >
          <Square className="w-5 h-5 text-slate-200" />
        </button>
        <button
          onClick={() => addElement('circle')}
          className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Circle"
        >
          <Circle className="w-5 h-5 text-slate-200" />
        </button>
        <button
          onClick={() => addElement('image')}
          className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Image"
        >
          <Image className="w-5 h-5 text-slate-200" />
        </button>

        {/*card preset buttons*/}
        <div className="w-full border-t border-slate-600 my-2"></div>
        <div className="text-slate-400 text-xs mb-2">Cards</div>

        <button
          onClick={() => addElement('profile-card')}
          className="w-12 h-12 bg-blue-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Profile Card"
        >
          Profile
        </button>
        <button
          onClick={() => addElement('artwork-card')}
          className="w-12 h-12 bg-amber-700 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Artwork Card"
        >
          Work Card
        </button>
        <button
          onClick={() => addElement('search-pill')}
          className="w-12 h-12 bg-orange-700 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Search Pill"
        >
          Bold Title
        </button>
        <button
          onClick={() => addElement('info-card')}
          className="w-12 h-12 bg-green-700 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Info Card"
        >
          Info Card
        </button>
        <button
          onClick={() => addElement('avatar')}
          className="w-12 h-12 bg-purple-700 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Avatar"
        >
          Avatar Image
        </button>
        <button
          onClick={() => addElement('feature-card')}
          className="w-12 h-12 bg-indigo-700 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Feature Card"
        >
          Large Card
        </button>
        <button
          onClick={() => addElement('stat-card')}
          className="w-12 h-12 bg-cyan-700 hover:bg-cyan-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Stat Card"
        >
          Stat Card
        </button>
        <button
          onClick={() => addElement('tag-pill')}
          className="w-12 h-12 bg-pink-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors text-xs text-white font-bold"
          title="Add Tag Pill"
        >
          Text Pill
        </button>   
        {/*download button*/}
        <div className="w-full border-t border-slate-600 my-2"></div>
        <button
          onClick={downloadAsImage}
          className="mt-4 w-12 h-12 bg-green-600 hover:bg-green-500 rounded-lg flex items-center justify-center transition-colors"
          title="Download Board as Image"
        >
          <Image className="w-6 h-6 text-white" />
        </button>
     </div>
          
     {/*Canvas css and card html*/}
     <div   //canvas
        className="flex-1 relative overflow-auto bg-slate-700"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref=  {canvasRef}
          className="relative bg-slate-800"
          style={{
            //same measurements as saved space
            width: '1920px',
            height: '1080px',
            backgroundImage: `
              linear-gradient(to right, rgba(71, 85, 105, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(71, 85, 105, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
          }}
          onClick={()=>{
            setSelectedId(null);
            setEditingId(null);
          }}
        ></div>

        <div className="absolute inset-0" style={{ width: '1920px', height: '1080px' }}>
        {elements.map((element)=>(
          <div
            key={element.id}
            //change cursor based on element 
            //no cursor for locked elements
            className={`absolute ${element.locked ? 'cursor-not-allowed' : editingId === element.id ? 'cursor-text' : 'cursor-move'} transition-shadow ${
              //highlight selected element w/blue
              selectedId === element.id ? 'ring-2 ring-blue-400 shadow-lg' : ''
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              backgroundColor: element.backgroundColor,
              borderRadius: element.borderRadius,
              padding: element.padding,
              zIndex: element.zIndex,
              pointerEvents: editingId === element.id ? 'auto' : 'auto'
            }}
            //handle dragging items that arzen't currently being edited
            onMouseDown={(e)=>{
              if(editingId !== element.id){
                handleMouseDown(e, element.id);
              }
            }}
            //enter edit mode by double click
            onDoubleClick={() => handleDoubleClick(element.id)}
            //single click to select elements
            onClick={(e)=>{
              e.stopPropagation();
              if(editingId !== element.id){
                setSelectedId(element.id);
              }
            }}
          >
             {/*text element*/}
            {element.type === 'text' && editingId === element.id ? (
              <textarea
                ref={textareaRef}
                value={element.content}
                onChange={(e) => handleTextChange(element.id, e.target.value)}
                onBlur={handleTextBlur}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  fontSize: element.fontSize,
                  fontWeight: element.fontWeight,
                  textAlign: element.textAlign as any,
                  color: '#333',
                  width: '100%',
                  height: '100%',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit'
                }}
                className="overflow-hidden"
              />
            ) : element.type === 'text' ? (
              <div
                style={{
                  fontSize: element.fontSize,
                  fontWeight: element.fontWeight,
                  textAlign: element.textAlign as any,
                  color: '#333',
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {element.content || 'Double click to edit'}
              </div>
            ) : null}

            {/*container element*/}
            {element.type === 'container' &&(
              <div className="w-full h-full" />
            )}

            {/*circle element*/}
            {element.type === 'circle' &&(
              <div className="w-full h-full" />
            )}   

            {/*image element*/}
            {element.type === 'image' && (
              <div className="w-full h-full bg-slate-300 flex items-center justify-center rounded-lg overflow-hidden">
                {element.imageUrl ? (
                  <img src={element.imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-12 h-12 text-slate-500" />
                )}
              </div>
            )}

            {/*pc card element*/}
            {element.type === 'profile-card' && (
              <div className="w-full h-full flex flex-col justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Profile Card</div>
                  <h2 className="text-4xl font-bold text-gray-800 mb-2">{element.title || 'Profile Name'}</h2>
                  <p className="text-gray-600">{element.subtitle || 'A brief description or tagline about this profile...'}</p>
                </div>
                <button className="self-start px-6 py-2 bg-white rounded-full text-sm font-medium border border-gray-300">
                  Profile
                </button>
              </div>
            )}

             {/*art card element*/}
            {element.type === 'artwork-card' && (
              <div className="w-full h-full flex flex-col justify-end">
                <div className="bg-black/30 backdrop-blur-sm text-white text-xs p-2 rounded-b-lg">
                  {element.content || 'text'}
                </div>
              </div>
            )}

             {/*info card element*/}
            {element.type === 'info-card' && (
              <div className="w-full h-full flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Circle className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{element.title || 'Info Title'}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{element.subtitle || 'Info description text'}</p>
                </div>
              </div>
            )}

             {/*character image element*/}
           {element.type === 'avatar' && (
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {element.imageUrl ?(
                  <img src={element.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-3/4 h-3/4 bg-white/50 rounded-full flex items-center justify-center">
                    <Image className="w-1/2 h-1/2 text-gray-400" />
                  </div>
                )}
              </div>
            )}

             {/*fc card element*/}
            {element.type === 'feature-card' && (
              <div className="w-full h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg mb-3 flex items-center justify-center">
                    <Circle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{element.title || 'Feature Title'}</h3>
                  <p className="text-sm text-gray-600">{element.subtitle || 'Feature description and benefits'}</p>
                </div>
              </div>
            )}

             {/*stat card element*/}
            {element.type === 'stat-card' && (
              <div className="w-full h-full flex flex-col justify-center items-center text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-1">{element.title || '1,234'}</h2>
                <p className="text-sm text-gray-600">{element.subtitle || 'Statistic Label'}</p>
              </div>
            )}

             {/*unused*/}
            {element.type === 'tag-pill' &&(
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">{element.content || 'Tag'}</span>
              </div>
            )}

            {selectedId === element.id && !element.locked && editingId !== element.id &&(
              <>
                <div
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize z-10"
                  onMouseDown={(e) => handleResizeStart(e, element.id)}
                />
              </>
            )}

            {element.locked &&(   
              <div className="absolute top-2 right-2 bg-slate-700 rounded p-1">
                <Lock className="w-3 h-3 text-slate-300" />
              </div>
            )}    
          </div>    
        ))}
        </div>
      </div>
    {/*html and css for editing panel next*/}
    {selectedElement &&(
        <div className="w-72 bg-slate-900/50 backdrop-blur border-l border-slate-700 p-4 overflow-y-auto">
          {/*added close panel button*/}  
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-200 font-semibold">Properties</h3>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="Close panel"
            >   
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">

              {/*copy and paste element button*/}
              <button
                onClick={duplicateElement}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm flex items-center justify-center gap-2"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              {/*lock element button*/}
              <button
                onClick={toggleLock}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm flex items-center justify-center gap-2"
                title="Lock/Unlock (Ctrl+L)"
              >
                {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {selectedElement.locked ? 'Unlock' : 'Lock'}
              </button>
              {/*trashcan button*/}
              <button
                onClick={deleteElement}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-white text-sm flex items-center justify-center"
                title="Delete (Del)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {/*list  of controls*/}
            <div className="text-slate-400 text-xs p-2 bg-slate-800 rounded">
              <div>Arrow keys: Move (Shift for 10px)</div>
              <div>Delete/Backspace: Remove</div>
              <div>Ctrl+D: Duplicate</div>
              <div>Ctrl+L: Lock/Unlock</div>
            </div>
            {/*options for adjusting elements*/}
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Position</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                  placeholder="X"
                  disabled={selectedElement.locked}
                />
                <input
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                  placeholder="Y"
                  disabled={selectedElement.locked}
                />
              </div>
            </div>
            
            {/*cont*/}
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Size</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })}
                  className="flex-1 px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                  placeholder="Width"
                  disabled={selectedElement.locked}
                />
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => updateElement(selectedElement.id, {height: parseInt(e.target.value) || 30 })}
                  className="flex-1 px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                  placeholder="Height"
                  disabled={selectedElement.locked}
                />
              </div>
            </div>

            {/*adjust background color*/}
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Background Color</label>
              <input
                type="color"
                value={selectedElement.backgroundColor || '#ffffff'}
                onChange={(e) => updateElement(selectedElement.id, {backgroundColor: e.target.value})}
                className="w-full h-10 bg-slate-800 rounded cursor-pointer"
                disabled={selectedElement.locked}
              />
            </div>

            {/*adjust border radius attribute*/}
            <div>   
              <label className="text-slate-300 text-sm mb-2 block">Border Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                value={selectedElement.borderRadius || 0}
                onChange={(e) => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                className="w-full"
                disabled={selectedElement.locked}
              />
            </div>
          </div>     
          {selectedElement.type === 'text' &&(
              <>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Text Align</label>
                  <select
                    value={selectedElement.textAlign || 'left'}
                    onChange={(e) => updateElement(selectedElement.id, { textAlign: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                    disabled={selectedElement.locked}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}

          {/*added profile card element*/}
            {(selectedElement.type === 'profile-card' || selectedElement.type === 'info-card' || selectedElement.type === 'feature-card' || selectedElement.type === 'stat-card') && (
              <>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Title</label>
                  <input
                    type="text"
                    value={selectedElement.title || ''}
                    onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                    disabled={selectedElement.locked}
                  />
                </div>
                <div>
                  {/*subtitle for card*/}
                  <label className="text-slate-300 text-sm mb-2 block">Subtitle</label>
                  <textarea
                    value={selectedElement.subtitle || ''}
                    onChange={(e) => updateElement(selectedElement.id, { subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                    rows={3}
                    disabled={selectedElement.locked}
                  />
                </div>                                 
              </>
            )}
          {/*artwork card element*/}
            {(selectedElement.type === 'artwork-card' || selectedElement.type === 'search-pill' || selectedElement.type === 'tag-pill') && (
              <div>
                <label className="text-slate-300 text-sm mb-2 block">Content Text</label>
                <input         
                  type="text"
                  value={selectedElement.content || ''}
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm"
                  disabled={selectedElement.locked}
                />
              </div>
            )}

          {/*image block element*/}
            {(selectedElement.type === 'image' || selectedElement.type === 'avatar') && (
              <div>
                <label className="text-slate-300 text-sm mb-2 block">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>{
                    const file = e.target.files?.[0];
                    if(file){
                      handleImageUpload(selectedElement.id, file);
                    }  
                  }}
                  className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"
                  disabled={selectedElement.locked}
                />                                     
                {/*remove image button*/}
                {selectedElement.imageUrl &&(                
                  <button
                    onClick={() => updateElement(selectedElement.id, { imageUrl: undefined })}
                    className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-white text-sm"
                    disabled={selectedElement.locked}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            )}
          </div>      
      )}
    </div>
  );                                 
};

export default App;                        
