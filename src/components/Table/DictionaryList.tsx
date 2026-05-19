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

/**
 * Dictionary List with Async State
 */
export default function DictionaryList({ dictionary, processing, error }: DictionaryListProps) {

  const dictionaryRows = Object.entries(dictionary).map(([key, value]) =>
    <li className="grid grid-cols-2 p-1 bg-white even:bg-slate-50 rounded-sm items-center" key={key}>
      <div className="font-medium p-2">{key}</div>
      <div>{value}</div>
    </li>
  )

  if (dictionaryRows.length === 0)
    return <></>

  const processingIndicator = <div className="absolute bg-white inset-0 opacity-85">
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <Spinner className="h-6 w-6" processing={true} />
    </div>
  </div>

  const errorIndicator = <div className="absolute bg-white inset-0 opacity-85">
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
      <ExclamationTriangleIcon className="h-5 w-5" />{error}
    </div>
  </div>

  return (
    <div className="relative">
      <ul className="divide-y divide-solid bg-white">
        {dictionaryRows}
      </ul>
      {processing && processingIndicator}
      {error && errorIndicator}
    </div>
  )
}

export function DictionaryListEntry({ displayName, value }: { displayName: string, value: string | React.ReactNode | undefined }) {
  return (
    <li className="grid grid-cols-2 p-1 bg-white even:bg-slate-50 rounded-sm items-center">
      <div className="font-medium p-2">{displayName}</div>
      <div>{value}</div>
    </li>
  )
}

interface DictionaryList2Props extends PropsWithChildren {
  processing?: boolean,
  error?: string
}

export function DictionaryList2({ processing, error, children }: DictionaryList2Props) {

  const processingIndicator = <div className="absolute bg-white inset-0 opacity-85">
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <Spinner className="h-6 w-6" processing={true} />
    </div>
  </div>

  const errorIndicator = <div className="absolute bg-white inset-0 opacity-85">
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
      <ExclamationTriangleIcon className="h-5 w-5" />{error}
    </div>
  </div>

  return (
    <div className="relative">
      <ul className="divide-y divide-solid bg-white">
        {children}
      </ul>
      {processing && processingIndicator}
      {error && errorIndicator}
    </div>
  )
}