import { useEffect, useRef } from "react";

export function MatrixBackground({
  className = "",
  children,
  fontSize = 16,
  speed = 1,
  color = "#00ff00",
  charset = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;

    canvas.width = width;
    canvas.height = height;

    let animationId;

    const chars = charset.split("");

    // Calculate columns
    const columnWidth = fontSize;
    let columnCount = Math.ceil(width / columnWidth);

    // Create columns
    const createColumn = (x) => ({
      x,
      y: Math.random() * -height,
      speed: (0.5 + Math.random() * 0.5) * speed,
      chars: Array.from({ length: 25 }, () => chars[Math.floor(Math.random() * chars.length)]),
      length: 15 + Math.floor(Math.random() * 15),
    });

    let columns = Array.from({ length: columnCount }, (_, i) =>
      createColumn(i * columnWidth)
    );

    // Resize handler
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width;
      canvas.height = height;
      columnCount = Math.ceil(width / columnWidth);

      // Adjust columns
      while (columns.length < columnCount) {
        columns.push(createColumn(columns.length * columnWidth));
      }
      columns = columns.slice(0, columnCount);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Parse color for variations
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 255, b: 0 };
    };

    const rgb = hexToRgb(color);

    // Animation
    const animate = () => {
      // Fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (const column of columns) {
        // Move column
        column.y += column.speed * fontSize * 0.5;

        // Draw characters
        for (let i = 0; i < column.length; i++) {
          const charY = column.y - i * fontSize;

          // Skip if off screen
          if (charY < -fontSize || charY > height + fontSize) continue;

          // Calculate opacity (brightest at head)
          const opacity = i === 0 ? 1 : Math.max(0, 1 - i / column.length);

          // Lead character is bright white-green, trail fades
          if (i === 0) {
            ctx.fillStyle = `rgba(${Math.min(255, rgb.r + 150)}, ${Math.min(
              255,
              rgb.g + 150
            )}, ${Math.min(255, rgb.b + 150)}, ${opacity})`;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.8})`;
            ctx.shadowBlur = 0;
          }

          // Randomly change character sometimes
          if (Math.random() < 0.02) {
            column.chars[i % column.chars.length] =
              chars[Math.floor(Math.random() * chars.length)];
          }

          ctx.fillText(column.chars[i % column.chars.length], column.x, charY);
        }

        ctx.shadowBlur = 0;

        // Reset column when off screen
        if (column.y - column.length * fontSize > height) {
          column.y = Math.random() * -height * 0.5;
          column.speed = (0.5 + Math.random() * 0.5) * speed;
          column.length = 15 + Math.floor(Math.random() * 15);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    // Initial fill
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
    };
  }, [fontSize, speed, color, charset]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000000',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Scanline effect */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)",
        }}
      />
      {/* Vignette */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      {/* Content layer */}
      {children && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            height: '100%',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
