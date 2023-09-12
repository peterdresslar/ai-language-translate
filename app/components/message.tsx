import React from "react";
import Container from "./container";

export default function Message({
    ...props
  }) {
    return (
        <Container
            className={`message flex w-full flex-col  ${props.align === "left" ? "" : "items-center justify-center text-center"
                }`}>
            {props.translated && (
                <div className="text-sm mb-2 font-bold text-indigo-600">
                    {props.translated}
                </div>
            )}
            {props.message && (
                <div className="text-sm mb-1 text-indigo-600">
                    {props.message}
                </div>
            )}
            {props.moreMessage && (
                <div className="text-sm text-indigo-600">
                    {props.moreMessage}
                </div>
            )}
        </Container>
    );
}

