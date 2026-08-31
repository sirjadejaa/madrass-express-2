const toastTimeouts = new Map();
const autoDismissTimeouts = new Map();

let memoryState = { toasts: [] };
let count = 0;

function genId() {
  count++;
  return count.toString();
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts] };
    case "DISMISS_TOAST":
      return {
        toasts: state.toasts.map(t =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        )
      };
    case "REMOVE_TOAST":
      return { toasts: state.toasts.filter(t => t.id !== action.toastId) };
  }
  return state;
}

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  console.log("State updated:", memoryState.toasts.map(t => `${t.id}:${t.open}`).join(", "));
}

function toast() {
  const id = genId();
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  
  dispatch({ type: "ADD_TOAST", toast: { id, open: true } });
  
  const timeout = setTimeout(() => {
    console.log("Timeout fired for", id);
    dismiss();
  }, 3000);
  autoDismissTimeouts.set(id, timeout);
}

function useToastDismiss() {
  return (toastId) => {
    if (!toastId) {
      console.log("Clearing all timeouts!");
      autoDismissTimeouts.forEach(t => clearTimeout(t));
      autoDismissTimeouts.clear();
    }
    dispatch({ type: "DISMISS_TOAST", toastId });
  };
}

// Simulate
toast();
const dismissAll = useToastDismiss();
// Simulate useEffect running
dismissAll();

