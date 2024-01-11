"use client"

import { useEffect, useRef, useState, useMemo } from "react"

import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import {
    Card, 
    CardHeader, 
    CardBody, 
    Divider,
    Button
} from "@nextui-org/react";

import Image from "next/image";

import Pen from "../../../public/pen.png"
import Eraser from "../../../public/eraser.png"
import Pointer from "../../../public/pointer.png"

import PenLight from "../../../public/pen-light.png"
import EraserLight from "../../../public/eraser-light.png"
import PointerLight from "../../../public/pointer-light.png"

function Board() {
    const theme = "dark";
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const [selected, setSelected] = useState([true, false, false]);
    const [isDrawing, setIsDrawing] = useState(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    
    const strokeWidth = [1, 2.5, 4]

    const colorsLight = useMemo(() => [
        "#ffffff",
        "#e9fff9",
        "#9cc4b2",
        "#d64045",
        "#cfee9e",
        "#aa4465",
        "#499167",
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
        window.addEventListener('keydown', (e) => {
            if (e.key === "Escape") 
                setSelected([true, false, false])
            else if (e.key === "p")
                setSelected([false, true, false])
            else if (e.key === "e")
                setSelected([false, false, true])
        })

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
    }, [])

    const colorMenu = (
        <PopoverContent>
            <div className="px-1 py-2">
                <div>Colors</div>
                <div className="flex flex-row gap-1">
                    <div className="inline-grid grid-cols-3 gap-2 pt-2">
                        {(theme === "dark" ? colorsDark : colorsLight).map((color, index) => (
                            <div key={index}>
                            <div></div>
                                <Button
                                    className="border-1"
                                    isIconOnly
                                    style={{backgroundColor: color}}
                                    onPress={() => handleColorChange(color)}
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
                                    className="border-1"
                                    isIconOnly
                                    color="primary"
                                    onPress={() => handleStrokeChange(value * 2)}
                                    >
                                        <div className={`h-${0.5 * (index + 1)} w-6 bg-current rounded-xl`}></div>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PopoverContent>
    );

    const handleStrokeChange = (stroke: number) => {
        contextRef.current?.closePath();
        contextRef.current?.beginPath();
        contextRef.current!.lineWidth = stroke;
    }

    const handleColorChange = (color: string) => {
        contextRef.current?.closePath();
        contextRef.current?.beginPath();
        contextRef.current!.strokeStyle = color;
    }

    const startDrawing = ({nativeEvent}: any) => {
        if (selected[1]) {
            const {offsetX, offsetY} = nativeEvent;
            contextRef.current?.beginPath();
            contextRef.current?.moveTo(offsetX, offsetY);
            setIsDrawing(true)
            lastPoint.current = { x: offsetX, y: offsetY };
        }

    }

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false)
        lastPoint.current = null;
    }

    const draw = ({nativeEvent}: any) => {
        if (!isDrawing)
            return;

        const { offsetX, offsetY } = nativeEvent;
        
        if (lastPoint.current == null)
            return;

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
    }

    const handleButtonPress = (index: number) => {
        let newSelected = [false, false, false];
        newSelected[index] = true;
        setSelected(newSelected);
    }

    return (
        <main className="flex flex-row h-max w-max items-center justify-center p-0 bg-dotted">
            <Card className="w-15 absolute left-5 top-5 border-1">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl cursor-default">noʊtsi</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="flex flex-col gap-3 items-center justify-center">
                    <Button isIconOnly aria-label="Pointer" color="primary" variant={!selected[0] ? "flat" : undefined} onPress={() => handleButtonPress(0)} className="relative w-14">
                        <Image src={selected[0] ? PointerLight : Pointer} alt="Pointer" height={20}/>
                        <div className="absolute bottom-0.5 right-1 text-[10px]">Esc</div>
                    </Button>
                    <Popover placement="right" color="primary">
                        <PopoverTrigger onClick={() => handleButtonPress(1)}>
                            <Button isIconOnly aria-label="Pen" color="primary" variant={!selected[1] ? "flat" : undefined} className="relative w-14">
                                <Image src={selected[1] ? PenLight : Pen} alt="Pen" height={20}/>
                                <div className="absolute bottom-0.5 right-2 text-[10px]">P</div>
                            </Button>
                        </PopoverTrigger>
                        {colorMenu}
                    </Popover>
                    <Button isIconOnly aria-label="Eraser" color="primary" variant={!selected[2] ? "flat" : undefined} onPress={() => handleButtonPress(2)} className="relative w-14">
                        <Image src={selected[2] ? EraserLight : Eraser} alt="Eraser" height={20}/>
                        <div className="absolute bottom-0.5 right-2 text-[10px]">E</div>
                    </Button>
                </CardBody>
            </Card>
            <canvas
                className={`flex m-0 ${selected[1] ? "cursor-crosshair" : ""}`}
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
            />
        </main>
    )
}

export default Board