// Inspired by react-hot-toast library
import * as React from "react"

type ToastAction = { label: string; onClick: () => void };

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastAction;
}

type State = {
  toasts: Toast[];
}

const initialState: State = {
  toasts: [],
}

let memoryState: State = { ...initialState };

const listeners: Array<(state: State) => void> = [];

function dispatch(action: any) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

const reducer = (state: State, action: any): State => {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts],
            };
        case "DISMISS_TOAST":
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
        default:
            return state;
    }
};

let toastCount = 0;

function toast(props: Omit<Toast, 'id'>) {
    const id = toastCount++;
    const newToast: Toast = {
        id,
        ...props,
    };
    dispatch({ type: "ADD_TOAST", toast: newToast });
    
    setTimeout(() => {
        dispatch({ type: "DISMISS_TOAST", toastId: id });
    }, 5000); // Auto-dismiss after 5 seconds

    return id;
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        const listener = (newState: State) => setState(newState);
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    return {
        ...state,
        toast,
        dismiss: (toastId: number) => dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}

export { useToast, toast };
