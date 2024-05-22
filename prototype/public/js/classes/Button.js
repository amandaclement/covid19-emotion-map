import { COLOR_MAP } from '../data.js';

// Canvas button
export default class Button {
    constructor(label, positionX, positionY, updateCanvas) {
      this.label = label;
      this.positionX = positionX;
      this.positionY = positionY;
      this.color = this.getColor();
      this.button = this.createButton();
      this.updateCanvas = updateCanvas;
    }

    // Get emotion color
    getColor() {
        const [red, green, blue] = COLOR_MAP[this.label];
        return color(red, green, blue); 
    }

    // Handle button hover
    handleHover(button) {
        button.mouseOver(() => { 
            button.style('color', this.color)
                  .style('background', 'white')
                  .style('border', `2px solid ${this.color}`)
                  .html('filter');
        }).mouseOut(() => {
            button.style('color', 'white') 
                  .style('background-color', this.color)
                  .html(this.label);
        });
    }

    // Handle button click
    handleClick(button) {
        button.mousePressed(() => {
            // Call function passed as argument
            this.updateCanvas();
        });
    }

    // Create button
    createButton() {
        const button = createButton(this.label)
                       .class('filterButton')
                       .position(this.positionX, this.positionY)
                       .style('background-color', this.color);

        this.handleHover(button);
        this.handleClick(button);

        return button;
    }
  }