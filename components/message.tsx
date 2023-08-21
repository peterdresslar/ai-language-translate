import React from "react";
import Container from "./container";

export default function Message({
    ...props
  }) {
    return (
        <Container
            className={`message flex w-full flex-col  ${props.align === "left" ? "" : "items-center justify-center text-center"
                }`}>
            {props.message && (
                <div className="text-sm text-indigo-600">
                    {props.message}
                </div>
            )}

            {props.translated && (
                <div className="text-sm italic text-indigo-600">
                    {props.translated}
                </div>
            )}
        </Container>
    );
}

