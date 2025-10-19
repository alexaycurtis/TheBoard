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
    }
