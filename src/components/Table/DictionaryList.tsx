import React, { PropsWithChildren } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import Spinner from "../Misc/Spinner";

export interface DictionaryListProps {
  dictionary: DictionaryListEntries,
  processing?: boolean,
  error?: string
}

export interface DictionaryListEntries {
  [key: string]: string | React.ReactNode | undefined
}

const ROW_CLASS = "grid grid-cols-2 items-center gap-4 px-4 py-3 text-sm"
const LABEL_CLASS = "font-medium text-muted-foreground"
const OVERLAY_CLASS = "absolute inset-0 bg-background/85"

/**
 * Dictionary List with Async State
 */
export default function DictionaryList({ dictionary, processing, error }: DictionaryListProps) {

  const dictionaryRows = Object.entries(dictionary).map(([key, value]) =>
    <li className={ROW_CLASS} key={key}>
      <div className={LABEL_CLASS}>{key}</div>
      <div>{value}</div>
    </li>
  )

  if (dictionaryRows.length === 0)
    return <></>

  const processingIndicator = <div className={OVERLAY_CLASS}>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <Spinner className="h-6 w-6" processing={true} />
    </div>
  </div>

  const errorIndicator = <div className={OVERLAY_CLASS}>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
      <ExclamationTriangleIcon className="h-5 w-5" />{error}
    </div>
  </div>

  return (
    <div className="relative border rounded-lg overflow-hidden bg-background">
      <ul className="divide-y">
        {dictionaryRows}
      </ul>
      {processing && processingIndicator}
      {error && errorIndicator}
    </div>
  )
}

export function DictionaryListEntry({ displayName, value }: { displayName: string, value: string | React.ReactNode | undefined }) {
  return (
    <li className={ROW_CLASS}>
      <div className={LABEL_CLASS}>{displayName}</div>
      <div>{value}</div>
    </li>
  )
}

interface DictionaryList2Props extends PropsWithChildren {
  processing?: boolean,
  error?: string
}

export function DictionaryList2({ processing, error, children }: DictionaryList2Props) {

  const processingIndicator = <div className={OVERLAY_CLASS}>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <Spinner className="h-6 w-6" processing={true} />
    </div>
  </div>

  const errorIndicator = <div className={OVERLAY_CLASS}>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
      <ExclamationTriangleIcon className="h-5 w-5" />{error}
    </div>
  </div>

  return (
    <div className="relative border rounded-lg overflow-hidden bg-background">
      <ul className="divide-y">
        {children}
      </ul>
      {processing && processingIndicator}
      {error && errorIndicator}
    </div>
  )
}