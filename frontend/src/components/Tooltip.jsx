import React, { useState, useEffect, useRef, useId } from 'react';

export default function Tooltip({ children, content, label, placement = 'top', delay = 100, maxWidth = '260px' }) {
  const id = (useId ? useId() : null) || `tooltip-${Math.random().toString(36).slice(2,8)}`;
  const [visible, setVisible] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const wrapperRef = useRef(null);

  const text = (label || content || '').toString();

  useEffect(() => {
    return () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const scheduleShow = () => {
    clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => setVisible(true), delay);
  };

  const scheduleHide = () => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 80);
  };

  if (!children) return null;

  const childIsElement = React.isValidElement(children);

  // Determine if the child is natively focusable (button, a, input, select, textarea) or has tabIndex
  const isFocusable = (node) => {
    if (!React.isValidElement(node)) return false;
    const type = node.type;
    const focusableTags = ['button', 'a', 'input', 'select', 'textarea'];
    if (typeof type === 'string' && focusableTags.includes(type)) return true;
    if (node.props && typeof node.props.tabIndex !== 'undefined' && node.props.tabIndex >= 0) return true;
    if (node.props && node.props.onClick) return true;
    return false;
  };

  const childNode = childIsElement
    ? React.cloneElement(children, { 'aria-describedby': id })
    : (<span aria-describedby={id}>{children}</span>);

  // If children is not focusable, make the wrapper focusable so keyboard users can access the tooltip
  const wrapperTabIndex = childIsElement && isFocusable(children) ? undefined : 0;

  return (
    <span
      ref={wrapperRef}
      className="tooltip-wrapper"
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
      onFocus={scheduleShow}
      onBlur={scheduleHide}
      tabIndex={wrapperTabIndex}
      aria-describedby={text ? id : undefined}
    >
      {childNode}
      <span
        id={id}
        role="tooltip"
        className={`tooltip-bubble tooltip-${placement} ${visible ? 'visible' : ''}`}
        style={{ maxWidth }}
      >
        <span className="tooltip-content">{text}</span>
        <span className="tooltip-arrow" aria-hidden="true" />
      </span>
    </span>
  );
}
