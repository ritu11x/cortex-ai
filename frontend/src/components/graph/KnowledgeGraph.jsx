 import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const categoryConfig = {
  tech: { color: '#60a5fa', bg: '#1e3a5f', label: 'Tech' },
  health: { color: '#34d399', bg: '#1a3a2e', label: 'Health' },
  finance: { color: '#fbbf24', bg: '#3a2e1a', label: 'Finance' },
  travel: { color: '#f472b6', bg: '#3a1a2e', label: 'Travel' },
  other: { color: '#a78bfa', bg: '#2a1a3a', label: 'Other' },
}

const sourceConfig = {
  instagram: { icon: '◈', color: '#e1306c', bg: '#3a1a25', label: 'Instagram' },
  twitter: { icon: '𝕏', color: '#1da1f2', bg: '#1a2a3a', label: 'Twitter' },
  youtube: { icon: '▶', color: '#ff4444', bg: '#3a1a1a', label: 'YouTube' },
  whatsapp: { icon: '◉', color: '#25d366', bg: '#1a3a25', label: 'WhatsApp' },
  link: { icon: '↗', color: '#f59e0b', bg: '#3a2e1a', label: 'Web' },
  text: { icon: '✦', color: '#a78bfa', bg: '#2a1a3a', label: 'Note' },
  note: { icon: '✦', color: '#a78bfa', bg: '#2a1a3a', label: 'Note' },
}

export default function KnowledgeGraph({ items }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    if (!items || items.length === 0) return
    d3.select(svgRef.current).selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const cx = width / 2
    const cy = height / 2

    const svg = d3.select(svgRef.current)

    // Defs
    const defs = svg.append('defs')

    const glow = defs.append('filter').attr('id', 'glow')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const glowMerge = glow.append('feMerge')
    glowMerge.append('feMergeNode').attr('in', 'blur')
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const strongGlow = defs.append('filter').attr('id', 'strongGlow')
    strongGlow.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur')
    const sgMerge = strongGlow.append('feMerge')
    sgMerge.append('feMergeNode').attr('in', 'blur')
    sgMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const centerGrad = defs.append('radialGradient').attr('id', 'centerGrad')
    centerGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9333ea')
    centerGrad.append('stop').attr('offset', '100%').attr('stop-color', '#6d28d9')

    // Build nodes
    const nodes = items.map(item => {
      const src = sourceConfig[item.source_type] || sourceConfig.text
      return {
        id: item.id,
        title: item.title || 'Untitled',
        category: item.category || 'other',
        source_type: item.source_type || 'text',
        tags: item.tags || [],
        summary: item.summary || '',
        color: src.color,
        bg: src.bg,
        icon: src.icon,
        sourceLabel: src.label,
        radius: 28,
      }
    })

    const hubNode = {
      id: 'hub',
      title: 'Your Brain',
      isHub: true,
      color: '#9333ea',
      radius: 42,
      fx: cx,
      fy: cy,
    }

    const allNodes = [hubNode, ...nodes]

    // Links
    const links = nodes.map(n => ({
      source: 'hub',
      target: n.id,
      strength: 0.3,
      isHub: true,
    }))

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].tags.filter(t => nodes[j].tags.includes(t))
        if (shared.length > 0 || nodes[i].category === nodes[j].category) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: shared.length > 0 ? 0.6 : 0.2,
            isHub: false,
          })
        }
      }
    }

    // Simulation
    const simulation = d3.forceSimulation(allNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(130).strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(cx, cy))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20))

    // Orbit rings
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 130)
      .attr('fill', 'none').attr('stroke', 'rgba(139,92,246,0.06)').attr('stroke-width', 1).attr('stroke-dasharray', '4,8')
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 220)
      .attr('fill', 'none').attr('stroke', 'rgba(139,92,246,0.04)').attr('stroke-width', 1).attr('stroke-dasharray', '4,8')

    // Decorative dots
    const dotCount = Math.min(items.length * 2, 14)
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2
      const r = 180 + Math.random() * 50
      svg.append('circle')
        .attr('cx', cx + Math.cos(angle) * r)
        .attr('cy', cy + Math.sin(angle) * r)
        .attr('r', 3 + Math.random() * 2)
        .attr('fill', 'rgba(139,92,246,0.12)')
        .attr('stroke', 'rgba(139,92,246,0.25)')
        .attr('stroke-width', 1)
    }

    // Links
    const linkEl = svg.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => d.isHub ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)')
      .attr('stroke-width', d => d.isHub ? 1 : 0.8)
      .attr('stroke-dasharray', d => d.isHub ? 'none' : '3,6')

    // Nodes
    const nodeEl = svg.append('g').selectAll('g').data(allNodes).join('g')
      .style('cursor', d => d.isHub ? 'default' : 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0)
          if (!d.isHub) { d.fx = null; d.fy = null }
        })
      )

    // Hub
    const hubEl = nodeEl.filter(d => d.isHub)
    hubEl.append('circle').attr('r', 58).attr('fill', 'none')
      .attr('stroke', 'rgba(139,92,246,0.12)').attr('stroke-width', 1)
    hubEl.append('circle').attr('r', 42)
      .attr('fill', 'url(#centerGrad)').attr('filter', 'url(#strongGlow)')
    hubEl.append('text').text('C')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', 'white').attr('font-size', '22px').attr('font-weight', '900')
      .attr('font-family', 'sans-serif').style('pointer-events', 'none')
    hubEl.append('text').text('Cortex')

      .attr('text-anchor', 'middle').attr('dy', 62)
      .attr('fill', 'rgba(167,139,250,0.6)').attr('font-size', '11px')
      .attr('font-weight', '600').attr('font-family', 'sans-serif').style('pointer-events', 'none')

    // Regular nodes
    const regularEl = nodeEl.filter(d => !d.isHub)

    regularEl.append('circle')
      .attr('r', d => d.radius + 10)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.15)

    regularEl.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.bg)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#glow)')
      .on('mouseover', function (e, d) {
        d3.select(this).transition().duration(200).attr('r', d.radius + 5).attr('stroke-width', 2.5)
        setTooltip({ x: e.pageX, y: e.pageY, data: d })
      })
      .on('mousemove', (e, d) => setTooltip({ x: e.pageX, y: e.pageY, data: d }))
      .on('mouseout', function (e, d) {
        d3.select(this).transition().duration(200).attr('r', d.radius).attr('stroke-width', 1.5)
        setTooltip(null)
      })
      .on('click', (e, d) => { e.stopPropagation(); setSelectedNode(d) })

    regularEl.append('text')
      .text(d => d.icon)
      .attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('font-size', '15px').attr('font-family', 'sans-serif')
      .attr('fill', d => d.color).style('pointer-events', 'none')

    regularEl.append('text')
      .text(d => d.sourceLabel)
      .attr('text-anchor', 'middle').attr('dy', '1em')
      .attr('font-size', '8px').attr('font-weight', '700')
      .attr('font-family', 'sans-serif')
      .attr('fill', d => d.color).attr('opacity', 0.7)
      .style('pointer-events', 'none')

    regularEl.append('text')
      .text(d => d.title.length > 10 ? d.title.slice(0, 10) + '…' : d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', 48)
      .attr('fill', 'rgba(156,163,175,0.7)')
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .style('pointer-events', 'none')

    // Category legend
    const cats = [...new Set(items.map(i => i.category))]
    cats.forEach((cat, i) => {
      const cfg = categoryConfig[cat] || categoryConfig.other
      const g = svg.append('g').attr('transform', `translate(${16 + i * 85}, 16)`)
      g.append('circle').attr('r', 5).attr('fill', cfg.color).attr('opacity', 0.8)
      g.append('text').text(cfg.label).attr('x', 10).attr('dy', '0.35em')
        .attr('fill', cfg.color).attr('font-size', '11px').attr('font-family', 'sans-serif').attr('opacity', 0.7)
    })

    simulation.on('tick', () => {
      linkEl
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      nodeEl.attr('transform', d => `translate(${d.x ?? cx},${d.y ?? cy})`)
    })

    svg.on('click', () => setSelectedNode(null))
    return () => simulation.stop()
  }, [items])

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />

      {tooltip && (
        <div className="fixed z-50 pointer-events-none border border-white/10 rounded-2xl px-4 py-3 max-w-xs shadow-2xl"
          style={{ left: tooltip.x + 15, top: tooltip.y - 10, background: 'rgba(12,12,20,0.97)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: tooltip.data.color }} className="text-lg">{tooltip.data.icon}</span>
            <span className="text-white font-bold text-sm">{tooltip.data.title}</span>
          </div>
          <p className="text-gray-400 text-xs line-clamp-2 mb-2">{tooltip.data.summary}</p>
          <div className="flex gap-1 flex-wrap">
            {tooltip.data.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-purple-300/60 bg-purple-400/10 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {selectedNode && (
        <div className="absolute top-4 right-4 w-72 border border-white/10 rounded-2xl p-5 z-40 shadow-2xl"
          style={{ background: 'rgba(12,12,20,0.98)', backdropFilter: 'blur(20px)' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: selectedNode.bg, border: `1px solid ${selectedNode.color}` }}>
                <span style={{ color: selectedNode.color }}>{selectedNode.icon}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{selectedNode.sourceLabel}</p>
                <p className="text-gray-600 text-xs capitalize">{selectedNode.category}</p>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)}
              className="text-gray-600 hover:text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/5 text-xs">✕</button>
          </div>
          <h3 className="text-white font-black text-base mb-2">{selectedNode.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">{selectedNode.summary}</p>
          {selectedNode.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map(tag => (
                <span key={tag} className="text-xs text-purple-300/60 bg-purple-400/10 border border-purple-400/10 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 border border-white/5 rounded-xl px-4 py-2"
        style={{ background: 'rgba(12,12,20,0.8)' }}>
        <p className="text-gray-700 text-xs">Drag · Click to inspect · Hover to preview</p>
      </div>
    </div>
  )
}