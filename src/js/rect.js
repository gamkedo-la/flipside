export const Rect = function Rect(params ={
    left: 0, right: 0, width: 0, height: 0
}){
    this.right = this.left + this.width;
    this.bottom = this.top + this.height; 
    return this;
}

Rect.prototype.set = function(params = {
    left: 0, right: 0, width: 0, height: 0
}){
    this.left = left;
    this.top = top;
    this.width = params.width != 0 ? params.width : this.width;
    this.height = params.height !=0 ? params.height : this.height;
}

Rect.prototype.prototype.within = function(rect){
    return (
        rect.left <= this.left &&
      rect.right >= this.right &&
      rect.top <= this.top &&
      rect.bottom >= this.bottom
    )
}

Rect.prototype.overlaps = function(rect) {
    return (
        this.left < rect.right &&
        rect.left < this.right &&
        this.top < rect.bottom &&
        rect.top < this.bottom
      );
  }

export default Rect;