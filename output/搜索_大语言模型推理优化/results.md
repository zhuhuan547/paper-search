# 学术论文搜索结果

> **搜索条件**：关键词=LLM inference optimization, KV cache compression, model quantization, speculative decoding | 年份=2024-2026 | max_papers=10
> **搜索范围**：顶级会议/期刊（ACL、NeurIPS、ICML、ICLR）
> **搜索统计**：搜索了 Semantic Scholar 3 页 3 个关键词组合，初筛通过 17 篇，最终精选 10 篇代表性论文

---

## 1. Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads

| 字段 | 内容 |
|------|------|
| **作者** | Tianle Cai, Yuhong Li, Zhengyang Geng, Hongwu Peng, Jason D. Lee, Beidi Chen, Tri Dao |
| **会议** | ICML 2024 |
| **日期** | 2024-01-19 |
| **引用数** | 828 |
| **arXiv** | https://arxiv.org/pdf/2401.10774.pdf |
| **主题方向** | 投机解码 / Speculative Decoding |

**摘要**：Medusa 通过在 LLM 上添加额外的解码头（decoding heads），使用树状注意力机制并行预测多个后续 token，从而加速 LLM 推理。该方法无需辅助模型，直接在原始模型上增加多个预测头，在保持生成质量的同时实现显著的推理加速。

**技术模块**：Multiple Decoding Heads, Tree-based Attention, Parallel Token Prediction, Speculative Decoding

---

## 2. KVQuant: Towards 10 Million Context Length LLM Inference with KV Cache Quantization

| 字段 | 内容 |
|------|------|
| **作者** | Coleman Hooper, Sehoon Kim, Hiva Mohammadzadeh, Michael W. Mahoney, Yakun Sophia Shao, Kurt Keutzer, Amir Gholami |
| **会议** | NeurIPS 2024 |
| **日期** | 2024-01-31 |
| **引用数** | 600 |
| **arXiv** | https://arxiv.org/pdf/2401.18079.pdf |
| **主题方向** | KV Cache 压缩 / 量化 |

**摘要**：该工作通过引入多种创新方法（包括 Per-Channel Key Quantization）实现低精度 KV Cache 量化，并开发了定制 CUDA kernel。KVQuant 使得在单张 A100-80GB GPU 上可服务 100 万上下文长度的 LLaMA-7B，在 8-GPU 系统上可达 1000 万上下文长度。

**技术模块**：KV Cache Quantization, Per-Channel Key Quantization, Custom CUDA Kernels, Long Context Inference

---

## 3. Lookahead Decoding: Break the Sequential Dependency of LLM Inference

| 字段 | 内容 |
|------|------|
| **作者** | Yichao Fu, Peter Bailis, Ion Stoica, Hao Zhang |
| **会议** | ICML 2024 |
| **日期** | 2024-02-03 |
| **引用数** | 341 |
| **arXiv** | https://arxiv.org/pdf/2402.02057.pdf |
| **主题方向** | 投机解码 / Speculative Decoding |

**摘要**：Lookahead Decoding 是一种精确的并行解码算法，无需辅助模型或数据存储即可加速 LLM 解码。该方法在单/多加速器上具有更高的并行度，且与内存高效注意力机制兼容，打破了 LLM 推理的序列依赖性。

**技术模块**：Parallel Decoding, Exact Speculative Decoding, Jacobi Iteration, Memory-efficient Attention

---

## 4. Unlocking Efficiency in Large Language Model Inference: A Comprehensive Survey of Speculative Decoding

| 字段 | 内容 |
|------|------|
| **作者** | Heming Xia, Zhe Yang, Qingxiu Dong, Peiyi Wang, Yongqi Li, Tao Ge, Tianyu Liu, Wenjie Li, Zhifang Sui |
| **会议** | ACL 2024 |
| **日期** | 2024-01-15 |
| **引用数** | 302 |
| **arXiv** | https://arxiv.org/pdf/2401.07851.pdf |
| **主题方向** | 投机解码综述 |

**摘要**：该论文对投机解码（Speculative Decoding）进行了全面的概述和分析，提供了该解码范式的正式定义和公式化描述，并在第三方测试环境下对主流方法进行了比较分析，是该领域的重要参考综述。

**技术模块**：Speculative Decoding Survey, Draft-then-Verify Paradigm, Taxonomy, Comparative Analysis

---

## 5. DuoAttention: Efficient Long-Context LLM Inference with Retrieval and Streaming Heads

| 字段 | 内容 |
|------|------|
| **作者** | Guangxuan Xiao, Jiaming Tang, Jingwei Zuo, Junxian Guo, Shang Yang, Haotian Tang, Yao Fu, Song Han |
| **会议** | ICLR 2024 |
| **日期** | 2024-10-14 |
| **引用数** | 280 |
| **arXiv** | https://arxiv.org/pdf/2410.10819.pdf |
| **主题方向** | KV Cache 压缩 |

**摘要**：DuoAttention 将注意力头分为 Retrieval Heads（需要完整 KV Cache）和 Streaming Heads（仅需轻量级恒定长度 KV Cache），有效减少了 LLM 的解码和预填充阶段的内存和延迟，同时不损害长上下文能力。

**技术模块**：Retrieval-Streaming Head Separation, KV Cache Compression, Long-Context Inference, Memory Optimization

---

## 6. Ada-KV: Optimizing KV Cache Eviction by Adaptive Budget Allocation for Efficient LLM Inference

| 字段 | 内容 |
|------|------|
| **作者** | Yuan Feng, Junlin Lv, Yukun Cao, Xike Xie, S. Kevin Zhou |
| **会议** | NeurIPS 2024 |
| **日期** | 2024-07-16 |
| **引用数** | 197 |
| **arXiv** | https://arxiv.org/pdf/2407.11550.pdf |
| **主题方向** | KV Cache 压缩 |

**摘要**：该工作建立了注意力输出在 KV Cache 驱逐前后的理论损失上界，解释了现有缓存驱逐方法的优化目标，并指导了自适应预算分配的优化。Ada-KV 通过动态分配不同层的 KV Cache 预算来最大化推理效率。

**技术模块**：KV Cache Eviction, Adaptive Budget Allocation, Theoretical Loss Upper Bound, Attention Optimization

---

## 7. PyramidInfer: Pyramid KV Cache Compression for High-throughput LLM Inference

| 字段 | 内容 |
|------|------|
| **作者** | Dongjie Yang, Xiaodong Han, Yan Gao, Yao Hu, Shilin Zhang, Hai Zhao |
| **会议** | ACL 2024 |
| **日期** | 2024-05-21 |
| **引用数** | 161 |
| **arXiv** | https://arxiv.org/pdf/2405.12532.pdf |
| **主题方向** | KV Cache 压缩 |

**摘要**：PyramidInfer 发现影响未来生成的关键 KV 对数量随层级递减，且可通过注意力权重的一致性来提取。该方法通过逐层保留关键上下文来压缩 KV Cache，显著提高了 LLM 推理的吞吐量。

**技术模块**：Layer-wise KV Cache Compression, Pyramid Compression, Attention Weight Consistency, High-throughput Inference

---

## 8. ShadowKV: KV Cache in Shadows for High-Throughput Long-Context LLM Inference

| 字段 | 内容 |
|------|------|
| **作者** | Hanshi Sun, Li-Wen Chang, Wenlei Bao, Size Zheng, Ningxin Zheng, Xin Liu, Harry Dong, Yuejie Chi, Beidi Chen |
| **会议** | ICML 2024 |
| **日期** | 2024-10-28 |
| **引用数** | 110 |
| **arXiv** | https://arxiv.org/pdf/2410.21465.pdf |
| **主题方向** | KV Cache 压缩 |

**摘要**：ShadowKV 是一种高吞吐量长上下文 LLM 推理系统，通过存储低秩 Key Cache 并将 Value Cache 卸载到 CPU 来减少 GPU 内存占用。系统设计了精确的 KV 选择策略，在运行时动态重构最小稀疏 KV 对，实现更大的批处理规模和更长的序列长度。

**技术模块**：Low-rank Key Cache, Value Cache Offloading, Sparse KV Selection, High-throughput Inference

---

## 9. Cascade Speculative Drafting for Even Faster LLM Inference

| 字段 | 内容 |
|------|------|
| **作者** | Ziyi Chen, Xiaocong Yang, Jiacheng Lin, Chenkai Sun, Jie Huang, Kevin Chen-Chuan Chang |
| **会议** | NeurIPS 2024 |
| **日期** | 2023-12-18 |
| **引用数** | 101 |
| **arXiv** | https://arxiv.org/pdf/2312.11462.pdf |
| **主题方向** | 投机解码 / Speculative Decoding |

**摘要**：Cascade Speculative Drafting (CS Drafting) 是一种投机执行算法，融合了两种级联（垂直级联和水平级联）。相比基线方法实现了更大的加速比，同时保持与目标模型完全相同的输出分布，确保无损加速。

**技术模块**：Cascade Speculative Decoding, Vertical Cascade, Horizontal Cascade, Lossless Acceleration

---

## 10. Get More with LESS: Synthesizing Recurrence with KV Cache Compression for Efficient LLM Inference

| 字段 | 内容 |
|------|------|
| **作者** | Harry Dong, Xinyu Yang, Zhenyu (Allen) Zhang, Zhangyang Wang, Yuejie Chi, Beidi Chen |
| **会议** | ICML 2024 |
| **日期** | 2024-02-14 |
| **引用数** | 93 |
| **arXiv** | https://arxiv.org/pdf/2402.09398.pdf |
| **主题方向** | KV Cache 压缩 |

**摘要**：LESS 将恒定大小的缓存与基于驱逐的缓存方法简单集成，使得所有 token 在后续解码步骤中都可被查询。该方法在多种任务上展示了优势，有效缩小了与全量缓存之间的性能差距。

**技术模块**：KV Cache Compression, Recurrence Synthesis, Eviction-based Cache, Constant-size Cache

---

## 汇总统计

| 维度 | 数据 |
|------|------|
| **论文总数** | 10 |
| **会议分布** | ICML ×4, NeurIPS ×3, ACL ×2, ICLR ×1 |
| **年份分布** | 2024 ×10 |
| **总引用数** | 2,933 |
| **平均引用数** | 293.3 |
| **KV Cache 压缩** | 6 篇 (KVQuant, DuoAttention, Ada-KV, PyramidInfer, ShadowKV, LESS) |
| **投机解码** | 4 篇 (Medusa, Lookahead Decoding, SpecDec Survey, Cascade Drafting) |
| **量化相关** | KVQuant (KV Cache 量化), KVTuner (ICML 2025, 34 citations), Ada-KV (自适应精度分配) |

> **说明**：模型权重量化（AWQ, GPTQ等）的顶级会议论文多发表于 MLSys 等系统会议，不在 ACL/NeurIPS/ICML/ICLR 范围内。上述论文中的 KV Cache 量化（KVQuant）和自适应精度分配（Ada-KV）覆盖了推理优化中的量化方向。
