import { Component } from 'inferno';

interface ButtonProps {
    onClick: () => void;
    children: any;
    color?: string;
}

export class Button extends Component<ButtonProps> {
    render() {
        const { onClick, children, color } = this.props;
        const buttonStyle = {
            backgroundColor: color === 'red' ? '#ff0000' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
        };

        return (
            <button style={buttonStyle} onClick={onClick}>
                {children}
            </button>
        );
    }
}