import React, { useState, useEffect, useRef } from 'react';

const CalculatorModal = ({ onClose }) => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);

    const handleClick = (value) => {
        if (value === 'C') {
            setExpression('');
            setResult('');
        } else if (value === '=') {
            try {
                // eslint-disable-next-line no-eval
                const parsedExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
                if (!parsedExpression) return;
                let evalResult = eval(parsedExpression);

                // Format decimals nicely
                if (!Number.isInteger(evalResult)) {
                    evalResult = parseFloat(evalResult.toFixed(8));
                }
                setResult(evalResult.toString());
            } catch (e) {
                setResult('Error');
            }
        } else if (value === 'DEL') {
            setExpression((prev) => prev.slice(0, -1));
        } else {
            setExpression((prev) => prev + value);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleClick('='); }
        if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); handleClick('DEL'); }
        if (e.key.toLowerCase() === 'c') { e.preventDefault(); handleClick('C'); }
        if (/^[0-9.]$/.test(e.key)) { e.preventDefault(); handleClick(e.key); }
        if (e.key === '+') { e.preventDefault(); handleClick('+'); }
        if (e.key === '-') { e.preventDefault(); handleClick('-'); }
        if (e.key === '*') { e.preventDefault(); handleClick('*'); }
        if (e.key === '/') { e.preventDefault(); handleClick('/'); }
    };

    const buttons = [
        { label: 'C', type: 'action', color: '#ff4757' },
        { label: '(', type: 'action' },
        { label: ')', type: 'action' },
        { label: '/', type: 'operator' },
        { label: '7', type: 'number' },
        { label: '8', type: 'number' },
        { label: '9', type: 'number' },
        { label: '*', type: 'operator' },
        { label: '4', type: 'number' },
        { label: '5', type: 'number' },
        { label: '6', type: 'number' },
        { label: '-', type: 'operator' },
        { label: '1', type: 'number' },
        { label: '2', type: 'number' },
        { label: '3', type: 'number' },
        { label: '+', type: 'operator' },
        { label: '0', type: 'number', span: 2 },
        { label: '.', type: 'number' },
        { label: '=', type: 'action', color: '#10ac84' }
    ];

    const getButtonStyle = (btn) => {
        let baseStyle = { ...buttonStyle };
        if (btn.span) {
            baseStyle.gridColumn = `span ${btn.span}`;
        }
        if (btn.type === 'operator') {
            baseStyle.background = 'rgba(26, 115, 232, 0.1)';
            baseStyle.color = 'var(--primary-color)';
            baseStyle.fontWeight = '600';
            baseStyle.fontSize = '1.3rem';
        } else if (btn.type === 'action') {
            baseStyle.background = btn.color ? btn.color : '#f1f2f6';
            baseStyle.color = btn.color ? '#fff' : '#2f3542';
            baseStyle.fontWeight = '600';
        }
        return baseStyle;
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div
                style={modalContentStyle}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                ref={containerRef}
            >
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <i className="fas fa-calculator" style={{ fontSize: '1.2rem', color: '#1a73e8' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>Calculator</h3>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle} title="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div style={screenContainerStyle}>
                    <div style={expressionStyle}>
                        {expression || ' '}
                    </div>
                    <div style={resultStyle}>
                        {result || '0'}
                    </div>
                </div>

                <div style={gridStyle}>
                    {buttons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleClick(btn.label)}
                            style={getButtonStyle(btn)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.filter = 'brightness(1)';
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.9)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(11, 20, 55, 0.6)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1050,
};

const modalContentStyle = {
    background: '#111c44', // Dark card theme
    padding: '24px',
    borderRadius: '24px',
    width: '320px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const closeBtnStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    fontSize: '1rem',
    color: '#a3aed0',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
};

const screenContainerStyle = {
    background: '#0b1437',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.05)'
};

const expressionStyle = {
    fontSize: '1.2rem',
    color: '#a3aed0',
    minHeight: '24px',
    letterSpacing: '1px',
    wordBreak: 'break-all',
    textAlign: 'right',
    width: '100%'
};

const resultStyle = {
    fontSize: '2.5rem',
    color: '#ffffff',
    fontWeight: '600',
    minHeight: '48px',
    wordBreak: 'break-all',
    textAlign: 'right',
    width: '100%',
    letterSpacing: '-1px'
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
};

const buttonStyle = {
    padding: '16px 0',
    fontSize: '1.2rem',
    borderRadius: '12px',
    border: 'none',
    background: '#2b3674',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Roboto", sans-serif',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default CalculatorModal;
