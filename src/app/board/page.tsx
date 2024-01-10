"use client"

import { useEffect, useRef, useState } from "react"
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

function Board() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const [selected, setSelected] = useState([true, false, false]);
    const [isDrawing, setIsDrawing] = useState(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const [color, setColor] = useState("white")

    useEffect(() => {
        window.addEventListener('keydown', (e) => {
            if (e.key === "p") 
                setSelected([false, true, false])
            else if (e.key === "e")
                setSelected([false, false, true])
            else if (e.key === "Escape")
                setSelected([true, false, false])
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
        context.strokeStyle = color;
        context.lineWidth = 3;
        contextRef.current = context;

        return () => {

        }

    }, [color])

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
        <main className="flex flex-row h-max w-max items-center justify-center p-0">
            <Card className="w-15 absolute left-5 top-5">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-md">Notesy</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="flex flex-col gap-3 items-center justify-center">
                    <Button isIconOnly aria-label="Pointer" color="primary" variant={!selected[0] ? "flat" : undefined} onPress={() => handleButtonPress(0)}>
                        <Image src={Pointer} alt="Pointer" height={20}/>
                    </Button>
                    <Button isIconOnly aria-label="Pen" color="primary" variant={!selected[1] ? "flat" : undefined} onPress={() => handleButtonPress(1)}>
                        <Image src={Pen} alt="Pen" height={20}/>
                    </Button>
                    <Button isIconOnly aria-label="Eraser" color="primary" variant={!selected[2] ? "flat" : undefined} onPress={() => handleButtonPress(2)}>
                        <Image src={Eraser} alt="Eraser" height={20}/>
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