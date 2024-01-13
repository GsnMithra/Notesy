"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Socket, io } from "socket.io-client"

import { auth } from "../firebase";

import { Popover, PopoverTrigger, PopoverContent, Slider, Snippet, Tabs, Tab, Input, Spinner, User } from "@nextui-org/react";
import {
    Card, 
    CardHeader, 
    CardBody, 
    Divider,
    Button
} from "@nextui-org/react";

import Image from "next/image";

import Pen from "@/app/pen.png"
import Eraser from "@/app/eraser.png"
import Pointer from "@/app/pointer.png"

import PenLight from "@/app/pen-light.png"
import EraserLight from "@/app/eraser-light.png"
import PointerLight from "@/app/pointer-light.png"

import Undo from "@/app/undo.png"
import Redo from "@/app/redo.png"
import UndoLight from "@/app/undo-light.png"
import RedoLight from "@/app/redo-light.png"
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";

function Board() {
    let theme = useTheme().theme;
    if (theme === 'system')
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const [user, setUser] = useState<any>(null)
    const [avatar, setAvatar] = useState<any>("")
    const router = useRouter();

    const getModeItems = (item: string, selected: boolean) => {
        const itemMap = {
            "pen": [Pen, PenLight],
            "eraser": [Eraser, EraserLight],
            "pointer": [Pointer, PointerLight],
            "undo": [Undo, UndoLight],
            "redo": [Redo, RedoLight]
        }

        if (theme === "dark")
            return itemMap[item as keyof typeof itemMap][selected ? 0 : 1]
        return itemMap[item as keyof typeof itemMap][selected ? 1 : 0]
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                setAvatar(user.photoURL);
            } else {
                setUser(null);
                router.push("/")
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [darkMode, setDarkMode] = useState(theme === "dark" ? true : false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const [selected, setSelected] = useState([true, false, false])
    const [isDrawing, setIsDrawing] = useState(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null)
    const [selectedColor, setSelectedColor] = useState(theme === "dark" ? "#1a1a1a" : "#ffffff")
    const [selectedStroke, setSelectedStroke] = useState(1 * 2)
    const [eraserRadius, setEraserRadius] = useState(20)
    const [dotted, setDotted] = useState(true)
    const [eraserIndex, setEraserIndex] = useState({x: 0, y: 0})
    const [drawingHistory, setDrawingHistory] = useState<any[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [roomSize, setRoomSize] = useState(1)
    const [usernames, setUsernames] = useState([]);

    const strokeWidth = [1, 2.5, 4]

    function generateRandomString(length: number = 7) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
    
        for (let i = 0; i < length; i += 1) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
      
        return result;
    }

    const [room, setRoom] = useState(generateRandomString())
    const [currentRoom, setCurrentRoom] = useState(room)
    const [newRoomId, setNewRoomId] = useState("")
    const [socket, setSocket] = useState<Socket | null>(null)

    const colorsLight = useMemo(() => [
        "#ffffff",
        "#64c6ac",
        "#428f78",
        "#d64045",
        "#cfee9e",
        "#aa4465",
        "#9d001f",
        "#accbe1",
        "#9cc4b2",
    ], []);

    const colorsDark = useMemo(() => [
        "#1a1a1a",
        "#2d2d2d",
        "#4c4c4c",
        "#7c7c7c",
        "#d64045",
        "#aa4465",
        "#499167",
        "#accbe1",
        "#9cc4b2",
    ], []);

    useEffect(() => {
        const socket = io("http://192.168.0.113:8000")

        socket?.on("connect", () => {
            socket?.emit("join-room", { room: currentRoom })
        })

        socket?.on("draw", (data) => {
            const { offsetX, offsetY, lastPoint, color, strokeSize } = data
            if (contextRef.current)
                contextRef.current.strokeStyle = color;
            contextRef.current!.lineWidth = strokeSize;
            contextRef.current?.quadraticCurveTo(
                lastPoint.x,
                lastPoint.y,
                (lastPoint.x + offsetX) / 2,
                (lastPoint.y + offsetY) / 2
            );
            contextRef.current?.stroke();

            lastPoint.current = { x: offsetX, y: offsetY };

            const canvas = canvasRef.current;
            if (canvas) {
                const { width, height } = canvas.getBoundingClientRect();
                if (offsetX > width || offsetY > height) {
                    canvas.width = width * 2;
                    canvas.height = height * 2;
                    canvas.style.width = `${width}px`;
                    canvas.style.height = `${height}px`;
                    contextRef.current?.scale(2, 2);
                }
            }
        })

        setSocket(socket)
        
        return () => {
            socket?.disconnect()
        }
    }, [currentRoom])

    useEffect(() => {
        const initializeCanvas = () => {
            window.addEventListener('keydown', (e) => {
                if (e.key === "Escape") 
                    setSelected([true, false, false])
                else if (e.key === "p")
                    setSelected([false, true, false])
                else if (e.key === "e")
                    setSelected([false, false, true])
            });
    
            const canvas = canvasRef.current;
            if (canvas == null)
                return;
    
            canvas.width = window.innerWidth * 2;
            canvas.height = window.innerHeight * 2;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
    
            const context = canvas.getContext("2d");
            if (context == null)
                return;
            
            context.scale(2, 2);
            context.lineCap = "round";
            context.lineJoin = "round";
            context.lineWidth = 3;
            contextRef.current = context;
        };
    
        const initializationTimeout = setTimeout(() => {
            initializeCanvas();
        }, 1000);
    
        return () => clearTimeout(initializationTimeout);
    }, [])    

    useEffect(() => {
        window.addEventListener('mousemove', (e) => {
            if (selected[2]) 
                setEraserIndex({x: e.clientY, y: e.clientX})
        })

        return () => {
            window.removeEventListener('mousemove', () => {})
        }
    }, [selected])

    const eraserItems = (
        <PopoverContent className="ml-5 px-1 py-2 items-center justify-center w-32 p-3.5">
            <Slider
                label="Radius:" 
                step={10} 
                maxValue={40} 
                minValue={10} 
                defaultValue={20}
                className="max-w-md"
                color="secondary"
                value={eraserRadius}
                onChange={(value) => setEraserRadius(value as number)}
            />
        </PopoverContent>
    )

    const colorMenu = (
        <PopoverContent className="ml-5">
            <div className="px-1 py-2">
                <div>Colors</div>
                <div className="flex flex-row gap-1">
                    <div className="inline-grid grid-cols-3 gap-2 pt-2">
                        {(theme === "dark" ? colorsLight : colorsDark).map((color, index) => (
                            <div key={index}>
                            <div></div>
                                <Button
                                    isIconOnly
                                    style={{backgroundColor: color}}
                                    variant={selectedColor === color ? "faded" : undefined}
                                    onPress={() => handleColorChange(color)}
                                    color="secondary"
                                    >
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Divider orientation="vertical" className="bg-auto invert h-30 m-3"/>
                    <div className="flex flex-col gap-[13.5px] pt-2">
                        {strokeWidth.map((value, index) => (
                            <div key={index}>
                            <div></div>
                                <Button
                                    isIconOnly
                                    color="primary"
                                    onPress={() => handleStrokeChange(value * 2)}
                                    variant={selectedStroke === value * 2 ? "faded" : undefined}
                                    >
                                        <div className={`h-${0.5 * (index + 2)} w-6 bg-current rounded-xl`}></div>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PopoverContent>
    );

    const eraseWithContinuousDots = (x: number, y: number) => {
        const radius = eraserRadius;
        if (contextRef.current)
            contextRef.current.globalCompositeOperation = "destination-out";

        for (let angle = 0; angle <= 360; angle += 5) {
            const radians = (angle * Math.PI) / 180;
            const xPos = x + radius * Math.cos(radians);
            const yPos = y + radius * Math.sin(radians);
    
            contextRef.current?.beginPath();
            contextRef.current?.arc(xPos, yPos, radius, 0, 2 * Math.PI);
            contextRef.current?.fill();
        }

        if (contextRef.current)
            contextRef.current.globalCompositeOperation = "source-over";

        pushToHistory({ type: 'erase', x, y });
    };

    const handleStrokeChange = (stroke: number) => {
        contextRef.current?.closePath();
        contextRef.current?.beginPath();
        contextRef.current!.lineWidth = stroke;
        setSelectedStroke(stroke);
    }

    const handleColorChange = (color: string) => {
        contextRef.current?.closePath();
        contextRef.current?.beginPath();
        contextRef.current!.strokeStyle = color;
        setSelectedColor(color);
    }

    const startDrawing = ({nativeEvent}: any) => {
        const {offsetX, offsetY} = nativeEvent;
        if (selected[1]) {
            setIsDrawing(true)
            contextRef.current?.beginPath();
            contextRef.current?.moveTo(offsetX, offsetY);
            lastPoint.current = { x: offsetX, y: offsetY };
        } else if (selected[2]) {
            setIsDrawing(true)
            lastPoint.current = { x: offsetX, y: offsetY };
            eraseWithContinuousDots(offsetX, offsetY);
        }

        pushToHistory({ type: 'draw', lastPoint: { x: offsetX, y: offsetY } });
    }

    const finishDrawing = () => {
        setIsDrawing(false)
        contextRef.current?.closePath();
        lastPoint.current = null;
    }

    const draw = ({nativeEvent}: any) => {
        if (selected[0]) return;

        const { offsetX, offsetY } = nativeEvent;
        
        if (lastPoint.current == null) return;

        if (selected[2]) {
            eraseWithContinuousDots(offsetX, offsetY);
            lastPoint.current = { x: offsetX, y: offsetY };
        } else {
            contextRef.current?.quadraticCurveTo(
                lastPoint.current.x,
                lastPoint.current.y,
                (lastPoint.current.x + offsetX) / 2,
                (lastPoint.current.y + offsetY) / 2
            );
            contextRef.current?.stroke();

            contextRef.current?.beginPath();
            contextRef.current?.moveTo((lastPoint.current?.x + offsetX) / 2, (lastPoint.current?.y + offsetY) / 2);
            lastPoint.current = { x: offsetX, y: offsetY };

            const canvas = canvasRef.current;
            if (canvas) {
                const { width, height } = canvas.getBoundingClientRect();
                if (offsetX > width || offsetY > height) {
                    canvas.width = width * 2;
                    canvas.height = height * 2;
                    canvas.style.width = `${width}px`;
                    canvas.style.height = `${height}px`;
                    contextRef.current?.scale(2, 2);
                }
            }

            socket?.emit("draw", {
                offsetX,
                offsetY,
                lastPoint: lastPoint.current,
                color: selectedColor,
                strokeSize: selectedStroke,
                room: currentRoom
            })
        }
    }

    const handleButtonPress = (index: number) => {
        let newSelected = [false, false, false];
        newSelected[index] = true;
        setSelected(newSelected);
    }

    const pushToHistory = (action: any) => {
        const newHistory = drawingHistory.slice(0, historyIndex + 1);
        newHistory.push(action);
        setDrawingHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) 
            setHistoryIndex((prevIndex) => prevIndex - 1);
    };

    const redo = () => {
        if (historyIndex < drawingHistory.length - 1) 
            setHistoryIndex((prevIndex) => prevIndex + 1);
    };

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.clearRect(0, 0, window.innerWidth * 2, window.innerHeight * 2);
            drawingHistory.forEach((action) => {
                if (action.type === 'draw') {
                    const { offsetX, offsetY } = action;
                    contextRef.current?.quadraticCurveTo(
                        action.lastPoint.x,
                        action.lastPoint.y,
                        (action.lastPoint.x + offsetX) / 2,
                        (action.lastPoint.y + offsetY) / 2
                    );
                    contextRef.current?.stroke();
                } else if (action.type === 'erase') {
                    eraseWithContinuousDots(action.x, action.y);
                }
          });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selected[2]) {
            const updatedTop = `${eraserIndex.x - (eraserRadius * 2)}px`;
            const updatedLeft = `${eraserIndex.y - (eraserRadius * 2)}px`;

            const eraserElement = document.getElementById('eraserElement');
            if (eraserElement) {
                eraserElement.style.top = updatedTop;
                eraserElement.style.left = updatedLeft;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eraserRadius])

    if (!user) {
        return (
            <main className={`flex h-screen w-screen items-center justify-center ${dotted ? "bg-dotted" : ""}`}>
                <Spinner size="lg" />
            </main>
        )
    }

    const AvatarContent = (
        <PopoverContent className="p-3">
            <User
                name={auth.currentUser?.displayName || "Anonymous"}
                description={auth.currentUser?.email || "@anonymous"}
                avatarProps={{ src: avatar, alt: "" }}
            />

            <Divider className="my-2 m-5"/>
            {/* Room size: {roomSize}
            {usernames?.map((username, index) => (
                <div key={index}>{username}</div>
            ))}
            <Divider className="my-2 m-5"/> */}

            <Button
                color="primary"
                onClick={() => auth.signOut()}
            >
                Sign Out
            </Button>
        </PopoverContent>
      )

    return (
        <main className={`flex flex-row h-max w-max items-center justify-center p-0 ${dotted ? "bg-dotted" : ""}`}>
            <Popover placement="top-end">
                <PopoverTrigger>
                    <Avatar className="absolute bottom-5 right-5 cursor-pointer">
                        <AvatarImage src={avatar} alt="" />
                        <AvatarFallback>{auth.currentUser?.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </PopoverTrigger>
                    {AvatarContent}
            </Popover>
            {selected[2] && (
                <div className="absolute" style={{
                    pointerEvents: 'none',
                    top: `${eraserIndex.x - (eraserRadius * 4) / 2}px`,
                    left: `${eraserIndex.y - (eraserRadius * 4) / 2}px`,
                }}>
                    <div style={{
                            width: `${eraserRadius * 4}px`,
                            height: `${eraserRadius * 4}px`,
                            border: '1px solid bg-white',
                            borderRadius: '50%',
                            opacity: 0.2,
                        }}
                    ></div>
                </div>
            )}
            <div className="absolute top-5 right-5">
                <Tabs aria-label="Options" radius="md">
                    <Tab title="Create">
                        <Card className="absolute top-12 right-1">
                            <CardBody>
                                <Snippet>{currentRoom}</Snippet>
                            </CardBody>
                        </Card>  
                    </Tab>
                    <Tab title="Join">
                        <Card className="absolute top-12 right-1 w-52">
                            <CardBody className="flex flex-row gap-3 items-center justify-center">
                                <Input placeholder={"Paste room ID"} value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)}/>
                                <Button isIconOnly color="primary" variant="flat" onPress={() => {
                                    if (newRoomId === "")
                                        return;
                                    setCurrentRoom(newRoomId)
                                }}>Go</Button>
                            </CardBody>
                        </Card>
                    </Tab>
                </Tabs>
            </div>

            <Card className="w-15 absolute left-5 top-5 border-1">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl cursor-default">noʊtsi</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="flex flex-col gap-3 items-center justify-center">
                    <Button isIconOnly aria-label="Pointer" color="primary" variant={!selected[0] ? "flat" : undefined} onPress={() => handleButtonPress(0)} className="relative w-14">
                        <Image src={getModeItems("pointer", selected[0])} alt="Pointer" height={20}/>
                        <div className="absolute bottom-0.5 right-1 text-[8.5px]">Esc</div>
                    </Button>
                    <Popover placement="right-start" color="primary">
                        <PopoverTrigger onClick={() => handleButtonPress(1)}>
                            <Button isIconOnly aria-label="Pen" color="primary" variant={!selected[1] ? "flat" : undefined} className="relative w-14">
                                <Image src={getModeItems("pen", selected[1])} alt="Pen" height={20}/>
                                <div className="absolute bottom-0.5 right-2 text-[8.5px]">P</div>
                            </Button>
                        </PopoverTrigger>
                        {colorMenu}
                    </Popover>
                    <Popover placement="right-start" color="primary">
                        <PopoverTrigger onClick={() => handleButtonPress(2)}>
                            <Button isIconOnly aria-label="Eraser" color="primary" variant={!selected[2] ? "flat" : undefined} onPress={() => handleButtonPress(2)} className="relative w-14">
                                <Image src={getModeItems("eraser", selected[2])} alt="Eraser" height={20}/>
                                <div className="absolute bottom-0.5 right-2 text-[8.5px]">E</div>
                            </Button>
                        </PopoverTrigger>
                        {eraserItems}
                    </Popover>
                </CardBody>
            </Card>
            <div className="absolute bottom-5 left-5">
                <Button className="m-1" isIconOnly aria-label="Undo" color="primary" variant={dotted ? "flat" : undefined} onClick={undo}>
                    <Image src={theme === "light" ? Undo : UndoLight} alt="Undo" height={20}/>
                </Button>
                <Button className="m-1" isIconOnly aria-label="Undo" color="primary" variant={dotted ? "flat" : undefined} onClick={redo}>
                    <Image src={theme === "light" ? Redo : RedoLight} alt="Undo" height={20}/>
                </Button>
            </div>
            <canvas
                className={`flex m-0 ${selected[1] || selected[2] ? "cursor-crosshair" : ""}`}
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
            />
        </main>
    )
}

export default Board