import { Component } from 'inferno';

interface AlertProps {
    title: string;
    color: string;
    children: any;
}

export class Alert extends Component<AlertProps> {
    render() {
        const { title, color, children } = this.props;
        const alertStyle = {
            backgroundColor: color === 'green' ? '#d4edda' : '#f8d7da',
            color: color === 'green' ? '#155724' : '#721c24',
            border: `1px solid ${color === 'green' ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            padding: '16px',
            marginTop: '20px',
        };

        return (
            <div style={alertStyle}>
                <h4 style={{ margin: '0 0 8px' }}>{title}</h4>
                <p style={{ margin: '0' }}>{children}</p>
            </div>
        );
    }
}