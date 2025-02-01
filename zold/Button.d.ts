import { LitElement } from 'lit';
export default class Button extends LitElement {
    static styles: import("lit").CSSResult[];
    variant?: '' | 'link' | 'primary' | 'subtle' | 'transparent' | 'ghost';
    size?: '' | 'xs' | 'sm' | 'lg' | 'xl';
    href?: string;
    disabled: boolean;
    loading: boolean;
    square: boolean;
    full: boolean;
    circle: boolean;
    handleClick(event: MouseEvent): void;
    render(): import("lit").TemplateResult<1>;
}
