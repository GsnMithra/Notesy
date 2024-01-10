"use client"

import { useEffect, useRef, useState } from "react"

function Board() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
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
        context.strokeStyle = "black";
        context.lineWidth = 3;
        contextRef.current = context;
    }, [])

    const startDrawing = ({nativeEvent}: any) => {
        const {offsetX, offsetY} = nativeEvent;
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true)
        lastPoint.current = { x: offsetX, y: offsetY };
    }

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false)
        lastPoint.current = null;
    }

    const draw = ({nativeEvent}: any) => {
        if (!isDrawing)
            return;

        const {offsetX, offsetY} = nativeEvent;
        
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

    return (
        <main className="flex flex-row h-max w-max">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                // onWheel={}
                width={1000}
                height={500}
            />
        </main>
    )
}

export default Board