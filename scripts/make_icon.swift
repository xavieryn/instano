// Renders AppIcon 1024x1024: indigo field, white photo-frame glyph.
// Run: swift scripts/make_icon.swift <output.png>
import AppKit

let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)
image.lockFocus()

// Background: deep indigo, subtle vertical lift
let bg = NSGradient(
    starting: NSColor(calibratedRed: 0.36, green: 0.32, blue: 0.95, alpha: 1),
    ending: NSColor(calibratedRed: 0.26, green: 0.22, blue: 0.80, alpha: 1)
)!
bg.draw(in: NSRect(origin: .zero, size: size), angle: -90)

NSColor.white.setStroke()
NSColor.white.setFill()

// Photo frame: centered rounded square outline
let frameRect = NSRect(x: 232, y: 232, width: 560, height: 560)
let frame = NSBezierPath(roundedRect: frameRect, xRadius: 96, yRadius: 96)
frame.lineWidth = 56
frame.stroke()

// Sun: small filled circle upper-left inside the frame
let sun = NSBezierPath(ovalIn: NSRect(x: 356, y: 580, width: 110, height: 110))
sun.fill()

// Mountains: clipped to inner frame, filled silhouette
NSGraphicsContext.saveGraphicsState()
NSBezierPath(roundedRect: frameRect.insetBy(dx: 28, dy: 28), xRadius: 72, yRadius: 72).setClip()
let mountains = NSBezierPath()
mountains.move(to: NSPoint(x: 200, y: 232))
mountains.line(to: NSPoint(x: 430, y: 520))
mountains.line(to: NSPoint(x: 560, y: 380))
mountains.line(to: NSPoint(x: 660, y: 480))
mountains.line(to: NSPoint(x: 850, y: 232))
mountains.close()
mountains.fill()
NSGraphicsContext.restoreGraphicsState()

image.unlockFocus()

guard let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
    fatalError("PNG encode failed")
}
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon.png"
try! png.write(to: URL(fileURLWithPath: out))
print("wrote \(out)")
