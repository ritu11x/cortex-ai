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
  instagram: { icon: '◈', color: '#e1306c', label: 'Instagram' },
  twitter:   { icon: '𝕏', color: '#1da1f2', label: 'Twitter'   },
  youtube:   { icon: '▶', color: '#ff4444', label: 'YouTube'   },
  whatsapp:  { icon: '◉', color: '#25d366', label: 'WhatsApp'  },
  telegram:  { icon: '✈', color: '#0088cc', label: 'Telegram'  },
  tiktok:    { icon: '♪', color: '#ff0050', label: 'TikTok'    },
  link:      { icon: '↗', color: '#f59e0b', label: 'Web'       },
  article:   { icon: '📰', color: '#94a3b8', label: 'Article'  },
  text:      { icon: '✦', color: '#a78bfa', label: 'Note'      },
  note:      { icon: '✦', color: '#a78bfa', label: 'Note'      },
}

// ✅ Calculate connection strength between two items
function getConnectionStrength(a, b) {
  let strength = 0
  const reasons = []

  // Shared tags — strongest signal
  const sharedTags = (a.tags || []).filter(t => (b.tags || []).includes(t))
  if (sharedTags.length > 0) {
    strength += sharedTags.length * 0.4
    reasons.push(...sharedTags.map(t => `#${t}`))
  }

  // Same category
  if (a.category && b.category && a.category === b.category) {
    strength += 0.2
    reasons.push(a.category)
  }

  // Shared words in title
  const wordsA = (a.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const wordsB = (b.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const sharedWords = wordsA.filter(w => wordsB.includes(w))
  if (sharedWords.length > 0) {
    strength += sharedWords.length * 0.15
    reasons.push(...sharedWords)
  }

  // Shared words in summary
  const sumA = (a.summary || '').toLowerCase().split(/\s+/).filter(w => w.length > 4)
  const sumB = (b.summary || '').toLowerCase().split(/\s+/).filter(w => w.length > 4)
  const sharedSum = sumA.filter(w => sumB.includes(w))
  if (sharedSum.length > 2) {
    strength += 0.1
  }

  return { strength: Math.min(strength, 1), reasons: [...new Set(reasons)].slice(0, 3) }
}

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

    // ── Defs ──────────────────────────────────────────────────
    const defs = svg.append('defs')

    const glow = defs.append('filter').attr('id', 'glow')
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const gm = glow.append('feMerge')
    gm.append('feMergeNode').attr('in', 'blur')
    gm.append('feMergeNode').attr('in', 'SourceGraphic')

    const strongGlow = defs.append('filter').attr('id', 'strongGlow')
    strongGlow.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur')
    const sgm = strongGlow.append('feMerge')
    sgm.append('feMergeNode').attr('in', 'blur')
    sgm.append('feMergeNode').attr('in', 'SourceGraphic')

    defs.append('radialGradient').attr('id', 'centerGrad')
      .selectAll('stop').data([
        { offset: '0%', color: '#9333ea' },
        { offset: '100%', color: '#6d28d9' },
      ]).join('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    // ── Build nodes ───────────────────────────────────────────
    const nodes = items.map(item => {
      const cat = categoryConfig[(item.category || 'other').toLowerCase()] || categoryConfig.other
      const src = sourceConfig[item.source || item.source_type] || sourceConfig.link
      return {
        id:          item.id,
        title:       item.title || 'Untitled',
        category:    item.category || 'other',
        source_type: item.source || item.source_type || 'link',
        tags:        item.tags || [],
        summary:     item.summary || '',
        url:         item.url || '',
        // ✅ Color by CATEGORY not source
        color:       cat.color,
        bg:          cat.bg,
        icon:        src.icon,
        sourceLabel: src.label,
        catLabel:    cat.label,
        radius:      26,
        connectionCount: 0,
      }
    })

    const hubNode = {
      id: 'hub', title: 'Cortex', isHub: true,
      color: '#9333ea', radius: 42, fx: cx, fy: cy,
    }

    // ── Build smart links ─────────────────────────────────────
    const links = []

    // Hub to all nodes (weak)
    nodes.forEach(n => {
      links.push({ source: 'hub', target: n.id, strength: 0.1, isHub: true, reasons: [] })
    })

    // ✅ Node to node — based on MEANING (tags, category, title words)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const { strength, reasons } = getConnectionStrength(nodes[i], nodes[j])
        if (strength > 0.1) {
          links.push({
            source:   nodes[i].id,
            target:   nodes[j].id,
            strength,
            reasons,
            isHub:    false,
          })
          nodes[i].connectionCount++
          nodes[j].connectionCount++
        }
      }
    }

    // Scale node size by connection count
    nodes.forEach(n => {
      n.radius = 22 + Math.min(n.connectionCount * 4, 16)
    })

    const allNodes = [hubNode, ...nodes]

    // ── Simulation ────────────────────────────────────────────
    const simulation = d3.forceSimulation(allNodes)
      .force('link', d3.forceLink(links).id(d => d.id)
        .distance(d => d.isHub ? 150 : d.strength > 0.5 ? 80 : 140)
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(cx, cy))
      .force('collision', d3.forceCollide().radius(d => d.radius + 18))

    // ── Background rings ──────────────────────────────────────
    [120, 210, 300].forEach(r => {
      svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(139,92,246,0.05)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,8')
    })

    // ── Links ─────────────────────────────────────────────────
    const linkEl = svg.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => {
        if (d.isHub) return 'rgba(139,92,246,0.12)'
        if (d.strength > 0.6) return 'rgba(139,92,246,0.5)'
        if (d.strength > 0.3) return 'rgba(139,92,246,0.3)'
        return 'rgba(139,92,246,0.12)'
      })
      .attr('stroke-width', d => {
        if (d.isHub) return 0.5
        if (d.strength > 0.6) return 2.5
        if (d.strength > 0.3) return 1.5
        return 0.8
      })
      .attr('stroke-dasharray', d => d.isHub ? '3,6' : d.strength > 0.4 ? 'none' : '4,6')

    // ── Nodes ─────────────────────────────────────────────────
    const nodeEl = svg.append('g').selectAll('g').data(allNodes).join('g')
      .style('cursor', d => d.isHub ? 'default' : 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end',   (e, d) => {
          if (!e.active) simulation.alphaTarget(0)
          if (!d.isHub) { d.fx = null; d.fy = null }
        })
      )

    // Hub node
    const hubEl = nodeEl.filter(d => d.isHub)
    hubEl.append('circle').attr('r', 60).attr('fill', 'none')
      .attr('stroke', 'rgba(139,92,246,0.1)').attr('stroke-width', 1)
    hubEl.append('circle').attr('r', 42)
      .attr('fill', 'url(#centerGrad)').attr('filter', 'url(#strongGlow)')
    hubEl.append('text').text('C')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', 'white').attr('font-size', '22px').attr('font-weight', '900')
      .attr('font-family', 'sans-serif').style('pointer-events', 'none')
    hubEl.append('text').text('Cortex')
      .attr('text-anchor', 'middle').attr('dy', 62)
      .attr('fill', 'rgba(167,139,250,0.6)').attr('font-size', '11px')
      .attr('font-weight', '600').attr('font-family', 'sans-serif')
      .style('pointer-events', 'none')

    // Regular nodes
    const regularEl = nodeEl.filter(d => !d.isHub)

    // Outer glow ring
    regularEl.append('circle')
      .attr('r', d => d.radius + 12)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 0.6)
      .attr('stroke-opacity', 0.15)

    // Main circle — colored by CATEGORY
    regularEl.append('circle')
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

    // Source icon inside node
    regularEl.append('text')
      .text(d => d.icon)
      .attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('font-size', '14px').attr('font-family', 'sans-serif')
      .attr('fill', d => d.color).style('pointer-events', 'none')

    // Category label inside node
    regularEl.append('text')
      .text(d => d.catLabel)
      .attr('text-anchor', 'middle').attr('dy', '1em')
      .attr('font-size', '7px').attr('font-weight', '700')
      .attr('font-family', 'sans-serif')
      .attr('fill', d => d.color).attr('opacity', 0.8)
      .style('pointer-events', 'none')

    // Title below node
    regularEl.append('text')
      .text(d => d.title.length > 12 ? d.title.slice(0, 12) + '…' : d.title)
      .attr('text-anchor', 'middle').attr('dy', d => d.radius + 16)
      .attr('fill', 'rgba(156,163,175,0.75)')
      .attr('font-size', '9px').attr('font-family', 'sans-serif')
      .style('pointer-events', 'none')

    // ✅ Connection count badge (bigger = more connections)
    regularEl.filter(d => d.connectionCount > 1)
      .append('circle')
      .attr('cx', d => d.radius - 6).attr('cy', -(d => d.radius - 6))
      .attr('r', 8).attr('fill', d => d.color).attr('opacity', 0.9)

    regularEl.filter(d => d.connectionCount > 1)
      .append('text')
      .text(d => d.connectionCount)
      .attr('x', d => d.radius - 6).attr('y', d => -(d.radius - 6))
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', '7px').attr('font-weight', '900')
      .attr('fill', 'white').style('pointer-events', 'none')

    // ── Category legend ───────────────────────────────────────
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

    // ── Tick ──────────────────────────────────────────────────
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

      {/* Hover tooltip */}
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

      {/* Click panel */}
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
          <p className="text-gray-400 text-sm leading-relaxed mb-3">{selectedNode.summary}</p>

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

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-4 border border-white/5 rounded-xl px-4 py-2"
        style={{ background: 'rgba(12,12,20,0.8)' }}>
        <p className="text-gray-700 text-xs">Nodes colored by topic · Size = connections · Click to inspect</p>
      </div>
    </div>
  )
}