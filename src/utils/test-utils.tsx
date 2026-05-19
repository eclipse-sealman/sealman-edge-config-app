import { render, renderHook, RenderHookOptions, RenderOptions } from "@testing-library/react"
import { ReactElement } from "react"
import { queryClient} from '../config/queryConfig';
import { QueryClientProvider } from "@tanstack/react-query";

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({children}: {children: React.ReactNode}) => {
  return(
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: AllTheProviders, ...options})

// Custom renderHook to include the QueryClientProvider
export const customRenderHook = <Result, Props>(
  callback: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper">
) => renderHook(callback, { wrapper: AllTheProviders, ...options });


export {customRender as render}
export {customRenderHook as renderHook}
