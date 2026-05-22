import React from "react";

export function InputLabel(props: {children: React.ReactNode, id?: string}) {
    return <label id={props.id} className="font-medium text-sm text-gray-700">{props.children}</label>
}