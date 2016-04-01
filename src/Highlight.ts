/// <reference path="./LatinCell.ts" />
/// <reference path="./LatinHive.ts" />

namespace LatinSquare {
    export interface LatinHighlight {
        x: number;
        y: number;
        i: number;
        guess: number;
        solutions: number[];
    }

    let highlight: LatinHighlight;

    export function getHighlight(): LatinHighlight {
      return highlight;
    }

    export function setHighlight(target?: LatinSquare.Node | LatinSquare.Cell) {
        if (!target) {
            highlight = null;
            return;
        }

        highlight = {
            x: target.x,
            y: target.y,
            i: target.i,
            guess: target.guess || null,
            solutions: _.map<LatinSquare.Solution, number>(_.filter<LatinSquare.Solution>(target["solutions"], "valid"), "s")
        };
    }
}
