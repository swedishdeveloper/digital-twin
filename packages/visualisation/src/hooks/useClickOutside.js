import { useEffect, RefObject } from 'react';

type RefType = RefObject<HTMLElement>;
type CallbackType = () => void;

const useOutsideClick = (ref: RefType, callback: CallbackType): void => {
  const handleClick = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [ref, callback]);
};

export default useOutsideClick;
