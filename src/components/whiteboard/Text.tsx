import { TextLayer } from "@/lib/types";
import { colorToCss } from "@/lib/utils";
import { useMutation } from "@liveblocks/react/suspense";

type Props = {
    id: string;
    layer: TextLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
};

export default function Text({
    layer,
    onPointerDown,
    id,
    selectionColor,
}: Props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { x, y, width, height, fill, value } = layer;

    const updateValue = useMutation(({ storage }, newValue: string) => {
        const liveLayers = storage.get("layers");
        const liveLayer = liveLayers.get(id);
        if (liveLayer) {
            liveLayer.update({ value: newValue });
        }
    }, [id]);

    return (
        <foreignObject
            x={0}
            y={0}
            width={width}
            height={height}
            style={{
                transform: `translate(${x}px, ${y}px)`,
            }}
            onPointerDown={(e) => onPointerDown(e, id)}
        >
            <textarea
                className="h-full w-full bg-transparent outline-none resize-none border-none p-0 bg-none overflow-hidden"
                style={{
                    color: fill ? colorToCss(fill) : "#000",
                    fontSize: "24px",
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.2,
                    padding: "4px",
                    border: selectionColor ? `1px solid ${selectionColor}` : "none",
                }}
                value={value || ""}
                onChange={(e) => updateValue(e.target.value)}
                onPointerDown={(e) => {
                    // Stop propagation if selected to allow cursor placement
                    if (selectionColor) {
                        e.stopPropagation();
                    }
                }}
                onKeyDown={(e) => {
                    // Stop character deletion from being handled globally
                    if (e.key === "Backspace" && value !== "") {
                        e.stopPropagation();
                    }
                }}
                placeholder="Type..."
            />
        </foreignObject>
    );
}
