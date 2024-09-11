import { Component } from 'inferno';

interface TextProps {
    children: any;
}

export class Text extends Component<TextProps> {
    render() {
        return <p>{this.props.children}</p>;
    }
}