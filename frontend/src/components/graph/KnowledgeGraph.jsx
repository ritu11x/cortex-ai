import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const categoryConfig = {
  tech:    { color: '#60a5fa', bg: '#1e3a5f', label: 'Tech' },
  health:  { color: '#34d399', bg: '#1a3a2e', label: 'Health' },
  finance: { color: '#fbbf24', bg: '#3a2e1a', label: 'Finance' },
  travel:  { color: '#f472b6', bg: '#3a1a2e', label: 'Travel' },
  other:   { color: '#a78bfa', bg: '#2a1a3a', label: 'Other' },
}

const sourceConfig = {
  instagram: { icon: '◈', label: 'Instagram' },
  twitter:   { icon: '𝕏', label: 'Twitter'   },
  youtube:   { icon: '▶', label: 'YouTube'   },
  whatsapp:  { icon: '◉', label: 'WhatsApp'  },
  telegram:  { icon: '✈', label: 'Telegram'  },
  tiktok:    { icon: '♪', label: 'TikTok'    },
  link:      { icon: '↗', label: 'Web'       },
  article:   { icon: '📰', label: 'Article'  },
  text:      { icon: '✦', label: 'Note'      },
  note:      { icon: '✦', label: 'Note'      },
}

function getConnectionStrength(a, b) {
  let strength = 0
  const reasons = []

  const sharedTags = (a.tags || []).filter(t => (b.tags || []).includes(t))
  if (sharedTags.length > 0) {
    strength += sharedTags.length * 0.4
    reasons.push(...sharedTags.map(t => `#${t}`))
  }

  if (a.category && b.category && a.category === b.category) {
    strength += 0.2
    reasons.push(a.category)
  }

  const wordsA = (a.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const wordsB = (b.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const sharedWords = wordsA.filter(w => wordsB.includes(w))
  if (sharedWords.length > 0) {
    strength += sharedWords.length * 0.15
    reasons.push(...sharedWords)
  }

  return { strength: Math.min(strength, 1), reasons: [...new Set(reasons)].slice(0, 3) }
}

const catKeys = Object.keys(categoryConfig)

export default function KnowledgeGraph({ items }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    if (!items || items.length === 0) return
    d3.select(svgRef.current).selectAll('*').remove()

    const width  = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const cx = width / 2
    const cy = height / 2

    const svg = d3.select(svgRef.current)

    // Defs
    const defs = svg.append('defs')
    const glow = defs.append('filter').attr('id', 'glow')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const gm = glow.append('feMerge')
    gm.append('feMergeNode').attr('in', 'blur')
    gm.append('feMergeNode').attr('in', 'SourceGraphic')

    const strongGlow = defs.append('filter').attr('id', 'strongGlow')
    strongGlow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur')
    const sgm = strongGlow.append('feMerge')
    sgm.append('feMergeNode').attr('in', 'blur')
    sgm.append('feMergeNode').attr('in', 'SourceGraphic')

    // Build nodes — colored by CATEGORY
    const nodes = items.map(item => {
      const cat = categoryConfig[(item.category || 'other').toLowerCase()] || categoryConfig.other
      const src = sourceConfig[item.source || item.source_type] || sourceConfig.link
      return {
        id:          item.id,
        title:       item.title || 'Untitled',
        category:    item.category || 'other',
        tags:        item.tags || [],
        summary:     item.summary || '',
        url:         item.url || '',
        color:       cat.color,
        bg:          cat.bg,
        icon:        src.icon,
        sourceLabel: src.label,
        catLabel:    cat.label,
        radius:      24,
        connectionCount: 0,
      }
    })

    // Build links — by shared meaning
    const links = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const { strength, reasons } = getConnectionStrength(nodes[i], nodes[j])
        if (strength > 0.1) {
          links.push({ source: nodes[i].id, target: nodes[j].id, strength, reasons, })
          nodes[i].connectionCount++
          nodes[j].connectionCount++
        }
      }
    }

    // Isolated nodes — connect to nearest by category
    nodes.forEach(n => {
      if (n.connectionCount === 0) {
        const similar = nodes.find(m => m.id !== n.id && m.category === n.category)
        if (similar) {
          links.push({ source: n.id, target: similar.id, strength: 0.08, reasons: [] })
          n.connectionCount++
        }
      }
    })

    // Scale size by connections
    nodes.forEach(n => {
      n.radius = 22 + Math.min(n.connectionCount * 5, 18)
    })

    // Simulation — cluster by category
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id)
        .distance(d => d.strength > 0.5 ? 60 : d.strength > 0.3 ? 100 : 160)
        .strength(d => d.strength * 1.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(cx, cy))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20))
      // ✅ Cluster by category — same category items pull toward same area
      .force('x', d3.forceX(d => {
        const idx = catKeys.indexOf(d.category || 'other')
        const angle = (idx / catKeys.length) * Math.PI * 2
        return cx + Math.cos(angle) * 130
      }).strength(0.06))
      .force('y', d3.forceY(d => {
        const idx = catKeys.indexOf(d.category || 'other')
        const angle = (idx / catKeys.length) * Math.PI * 2
        return cy + Math.sin(angle) * 130
      }).strength(0.06))

    // Background dots like Miles
    const dotCount = Math.min(items.length * 3, 40)
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2
      const r = 60 + Math.random() * (Math.min(width, height) * 0.4)
      svg.append('circle')
        .attr('cx', cx + Math.cos(angle) * r)
        .attr('cy', cy + Math.sin(angle) * r)
        .attr('r', 1.5 + Math.random() * 2)
        .attr('fill', 'rgba(139,92,246,0.15)')
    }

    // Links
    const linkEl = svg.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => {
        if (d.strength > 0.6) return 'rgba(139,92,246,0.6)'
        if (d.strength > 0.3) return 'rgba(139,92,246,0.35)'
        return 'rgba(139,92,246,0.12)'
      })
      .attr('stroke-width', d => {
        if (d.strength > 0.6) return 2.5
        if (d.strength > 0.3) return 1.5
        return 0.8
      })
      .attr('stroke-dasharray', d => d.strength > 0.3 ? 'none' : '4,6')

    // Nodes
    const nodeEl = svg.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end',   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // Outer ring
    nodeEl.append('circle')
      .attr('r', d => d.radius + 10)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.2)

    // Main circle
    nodeEl.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.bg)
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.connectionCount > 2 ? 2.5 : 1.5)
      .attr('filter', 'url(#glow)')
      .on('mouseover', function(e, d) {
        d3.select(this).transition().duration(200).attr('r', d.radius + 5).attr('stroke-width', 3)
        setTooltip({ x: e.pageX, y: e.pageY, data: d })
      })
      .on('mousemove', (e, d) => setTooltip({ x: e.pageX, y: e.pageY, data: d }))
      .on('mouseout', function(e, d) {
        d3.select(this).transition().duration(200).attr('r', d.radius).attr('stroke-width', d.connectionCount > 2 ? 2.5 : 1.5)
        setTooltip(null)
      })
      .on('click', (e, d) => { e.stopPropagation(); setSelectedNode(d) })

    // Icon
    nodeEl.append('text')
      .text(d => d.icon)
      .attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('font-size', '13px').attr('font-family', 'sans-serif')
      .attr('fill', d => d.color).style('pointer-events', 'none')

    // Category label
    nodeEl.append('text')
      .text(d => d.catLabel)
      .attr('text-anchor', 'middle').attr('dy', '1em')
      .attr('font-size', '7px').attr('font-weight', '700')
      .attr('font-family', 'sans-serif')
      .attr('fill', d => d.color).attr('opacity', 0.8)
      .style('pointer-events', 'none')

    // Title below
    nodeEl.append('text')
      .text(d => d.title.length > 12 ? d.title.slice(0, 12) + '…' : d.title)
      .attr('text-anchor', 'middle').attr('dy', d => d.radius + 16)
      .attr('fill', 'rgba(156,163,175,0.7)')
      .attr('font-size', '9px').attr('font-family', 'sans-serif')
      .style('pointer-events', 'none')

    // Category legend
    const cats = [...new Set(items.map(i => i.category || 'other'))]
    cats.forEach((cat, i) => {
      const cfg = categoryConfig[cat] || categoryConfig.other
      const g = svg.append('g').attr('transform', `translate(${16 + i * 88}, 16)`)
      g.append('circle').attr('r', 5).attr('fill', cfg.color).attr('opacity', 0.9)
      g.append('text').text(cfg.label)
        .attr('x', 10).attr('dy', '0.35em')
        .attr('fill', cfg.color).attr('font-size', '11px')
        .attr('font-family', 'sans-serif').attr('opacity', 0.8)
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
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: tooltip.data.color }}>{tooltip.data.icon}</span>
            <span className="text-white font-bold text-sm">{tooltip.data.title}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
              style={{ background: `${tooltip.data.color}20`, color: tooltip.data.color, border: `1px solid ${tooltip.data.color}30` }}>
              {tooltip.data.catLabel}
            </span>
            <span className="text-gray-600 text-xs">{tooltip.data.connectionCount} connections</span>
          </div>
          <p className="text-gray-400 text-xs line-clamp-2 mb-2">{tooltip.data.summary}</p>
          <div className="flex gap-1 flex-wrap">
            {tooltip.data.tags?.slice(0, 4).map(tag => (
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
                <p className="text-white font-bold text-sm">{selectedNode.catLabel}</p>
                <p className="text-gray-600 text-xs">{selectedNode.connectionCount} connections</p>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)}
              className="text-gray-600 hover:text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/5 text-xs">✕</button>
          </div>
          <h3 className="text-white font-black text-base mb-2 leading-snug">{selectedNode.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-4">{selectedNode.summary}</p>
          {selectedNode.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {selectedNode.tags.map(tag => (
                <span key={tag} className="text-xs text-purple-300/60 bg-purple-400/10 border border-purple-400/10 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
          {selectedNode.url && (
            <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              Open content ↗
            </a>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 border border-white/5 rounded-xl px-4 py-2"
        style={{ background: 'rgba(12,12,20,0.8)' }}>
        <p className="text-gray-700 text-xs">Nodes colored by topic · Connected by meaning · Click to inspect</p>
      </div>
    </div>
  )
}
