import { Component } from 'inferno';

interface CardProps {
    children: any;
}

export class Card extends Component<CardProps> {
    render() {
        return (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '16px' }}>
                {this.props.children}
            </div>
        );
    }
}