

This is the code example, but instead of circles there should be the tick marks

"use client"

import { motion, Variants } from "motion/react"

const draw: Variants = {
hidden: { pathLength: 0, opacity: 0 },
visible: (i: number) => {
const delay = i * 0.5
return {
pathLength: 1,
opacity: 1,
transition: {
pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
opacity: { delay, duration: 0.01 },
},
}
},
}

export default function PathDrawing() {
return (
<motion.svg
width="600"
height="600"
viewBox="0 0 600 600"
initial="hidden"
animate="visible"
style={image}
>
<motion.circle
className="circle-path"
cx="100"
cy="100"
r="80"
stroke="#ff0088"
variants={draw}
custom={1}
style={shape}
/>
<motion.line
x1="220"
y1="30"
x2="360"
y2="170"
stroke="#8df0cc"
variants={draw}
custom={2}
style={shape}
/>
<motion.line
x1="220"
y1="170"
x2="360"
y2="30"
stroke="#8df0cc"
variants={draw}
custom={2.5}
style={shape}
/>
<motion.rect
width="140"
height="140"
x="410"
y="30"
rx="20"
stroke="#0d63f8"
variants={draw}
custom={3}
style={shape}
/>
<motion.circle
cx="100"
cy="300"
r="80"
stroke="#0d63f8"
variants={draw}
custom={2}
style={shape}
/>
<motion.line
x1="220"
y1="230"
x2="360"
y2="370"
stroke="#ff0088"
custom={3}
variants={draw}
style={shape}
/>
<motion.line
x1="220"
y1="370"
x2="360"
y2="230"
stroke="#ff0088"
custom={3.5}
variants={draw}
style={shape}
/>
<motion.rect
width="140"
height="140"
x="410"
y="230"
rx="20"
stroke="#8df0cc"
custom={4}
variants={draw}
style={shape}
/>
<motion.circle
cx="100"
cy="500"
r="80"
stroke="#8df0cc"
variants={draw}
custom={3}
style={shape}
/>
<motion.line
x1="220"
y1="430"
x2="360"
y2="570"
stroke="#0d63f8"
variants={draw}
custom={4}
style={shape}
/>
<motion.line
x1="220"
y1="570"
x2="360"
y2="430"
stroke="#0d63f8"
variants={draw}
custom={4.5}
style={shape}
/>
<motion.rect
width="140"
height="140"
x="410"
y="430"
rx="20"
stroke="#ff0088"
variants={draw}
custom={5}
style={shape}
/>
</motion.svg>
)
}

/**
* ==============   Styles   ================
  */

const image: React.CSSProperties = {
maxWidth: "80vw",
}

const shape: React.CSSProperties = {
strokeWidth: 10,
strokeLinecap: "round",
fill: "transparent",
}


This is the code example for reorder

"use client"

import { Transition } from "motion/react"
import * as motion from "motion/react-client"
import { useEffect, useState } from "react"

export default function Reordering() {
const [order, setOrder] = useState(initialOrder)

    useEffect(() => {
        const timeout = setTimeout(() => setOrder(shuffle(order)), 1000)
        return () => clearTimeout(timeout)
    }, [order])

    return (
        <ul style={container}>
            {order.map((backgroundColor) => (
                <motion.li
                    key={backgroundColor}
                    layout
                    transition={spring}
                    style={{ ...item, backgroundColor }}
                />
            ))}
        </ul>
    )
}

const initialOrder = [
"#ff0088",
"#dd00ee",
"#9911ff",
"#0d63f8",
]

/**
* ==============   Utils   ================
  */
  function shuffle([...array]: string[]) {
  return array.sort(() => Math.random() - 0.5)
  }

/**
* ==============   Styles   ================
  */

const spring: Transition = {
type: "spring",
damping: 20,
stiffness: 300,
}

const container: React.CSSProperties = {
listStyle: "none",
padding: 0,
margin: 0,
position: "relative",
display: "flex",
flexWrap: "wrap",
gap: 10,
width: 300,
flexDirection: "row",
justifyContent: "center",
alignItems: "center",
}

const item: React.CSSProperties = {
width: 100,
height: 100,
borderRadius: "10px",
}
