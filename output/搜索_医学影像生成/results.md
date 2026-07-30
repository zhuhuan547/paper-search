# 学术论文搜索结果

> **搜索条件**：关键词=medical image generation, diffusion model, chest X-ray, CT, report generation, super-resolution | 年份=2023-2025 | max_papers=8
> **搜索范围**：Semantic Scholar（高引排序），中英文文献均可
> **搜索统计**：搜索了 Semantic Scholar 2 个关键词组合 1 页，初筛通过 20+ 篇，最终精选 8 篇高引论文

---

## 1. Dynamic Graph Enhanced Contrastive Learning for Chest X-Ray Report Generation

| 字段 | 内容 |
|------|------|
| **作者** | Mingjie Li, Bingqian Lin, Zicong Chen, Haokun Lin, Xiaodan Liang, Xiaojun Chang |
| **会议/期刊** | CVPR 2023 |
| **日期** | 2023-03-18 |
| **引用数** | 230 |
| **论文链接** | IEEE |
| **主题方向** | 胸片报告生成 |

**摘要**：该论文提出了一种基于动态知识图谱的对比学习框架 (DCL)，用于胸片报告生成。引入 Image-Report Contrastive 和 Image-Report Matching 损失来更好地表示视觉特征和文本信息，显著提升了放射学报告自动生成的质量。

**技术模块**：Dynamic Knowledge Graph, Contrastive Learning, Image-Report Matching, Chest X-Ray Report Generation

---

## 2. A Vision-Language Foundation Model for the Generation of Realistic Chest X-Ray Images

| 字段 | 内容 |
|------|------|
| **作者** | Christian Bluethgen, Pierre J. Chambon, et al. (9 authors), Akshay S. Chaudhari |
| **会议/期刊** | Nature Biomedical Engineering (2024) |
| **日期** | 2024-08-26 |
| **引用数** | 147 |
| **DOI** | https://doi.org/10.1038/s41551-024-01246-y |
| **主题方向** | 胸片图像生成 / 扩散模型 |

**摘要**：该工作展示了一种在自然图像-文本对上预训练的潜在扩散模型（Latent Diffusion Model），可被适配用于生成多样且视觉逼真的合成胸片图像，其外观可通过自由形式的医学文本提示进行控制。这是将视觉-语言基础模型应用于医学影像生成的重要里程碑，发表于 Nature 子刊。

**技术模块**：Latent Diffusion Model, Vision-Language Foundation Model, Chest X-Ray Generation, Text-Conditioned Synthesis

---

## 3. CBCT-Based Synthetic CT Image Generation Using Conditional Denoising Diffusion Probabilistic Model

| 字段 | 内容 |
|------|------|
| **作者** | Junbo Peng, Richard L. J. Qiu, et al. (10 authors), Xiaofeng Yang |
| **会议/期刊** | Medical Physics (2023) |
| **日期** | 2023-03-05 |
| **引用数** | 131 |
| **PubMed** | https://www.ncbi.nlm.nih.gov/pubmed/37646491 |
| **主题方向** | CT 图像生成 / 扩散模型 |

**摘要**：该研究提出了基于条件 DDPM 的方法，从锥形束 CT (CBCT) 生成合成 CT (sCT)，具有准确的 HU 值和减少的伪影。该方法能够实现基于 CBCT 的精确器官分割和剂量计算，用于在线自适应放疗 (ART)，是扩散模型在 CT 影像转换中的重要应用。

**技术模块**：Conditional DDPM, CBCT-to-CT Translation, Synthetic CT Generation, Adaptive Radiotherapy

---

## 4. Fast-DDPM: Fast Denoising Diffusion Probabilistic Models for Medical Image-to-Image Generation

| 字段 | 内容 |
|------|------|
| **作者** | Hongxu Jiang, M. Imran, et al. (6 authors), W. Shao |
| **会议/期刊** | IEEE Journal of Biomedical and Health Informatics (2024) |
| **日期** | 2024-05-23 |
| **引用数** | 99 |
| **主题方向** | 医学图像生成 / 快速扩散模型 |

**摘要**：Fast-DDPM 是一种简单而有效的方法，能同时提升医学影像中扩散模型的训练速度、采样速度和生成质量。在多项任务中超越了 DDPM 及当前基于卷积网络和生成对抗网络的最先进方法，是医学图像生成效率优化的重要工作。

**技术模块**：Fast Diffusion Models, Medical Image-to-Image Generation, Training Speed Optimization, Sampling Acceleration

---

## 5. Anatomically-Controllable Medical Image Generation with Segmentation-Guided Diffusion Models

| 字段 | 内容 |
|------|------|
| **作者** | Nicholas Konz, Yuwen Chen, Haoyu Dong, Maciej Mazurowski |
| **会议/期刊** | MICCAI 2024 |
| **日期** | 2024-02-07 |
| **引用数** | 99 |
| **arXiv** | https://arxiv.org/pdf/2402.05210.pdf |
| **主题方向** | 医学图像生成 / 扩散模型 |

**摘要**：该工作提出了基于扩散模型的方法，支持解剖结构可控的医学图像生成。通过在每个采样步骤中遵循多类别解剖分割掩码，并引入随机掩码消融训练算法，使模型能够基于选定的解剖约束组合进行条件生成，为可控医学图像合成开辟了新方向。

**技术模块**：Segmentation-Guided Diffusion, Anatomically-Controllable Generation, Multi-Class Anatomical Mask Conditioning

---

## 6. Multimodal Image-Text Matching Improves Retrieval-based Chest X-Ray Report Generation

| 字段 | 内容 |
|------|------|
| **作者** | Jaehwan Jeong, Katherine Tian, et al. (9 authors), Pranav Rajpurkar |
| **会议/期刊** | MIDL 2023 |
| **日期** | 2023-03-29 |
| **引用数** | 92 |
| **arXiv** | https://arxiv.org/pdf/2303.17579.pdf |
| **主题方向** | 胸片报告生成 |

**摘要**：提出了 X-REM (Contrastive X-Ray REport Match)，一种基于检索的放射学报告生成模块。使用图像-文本匹配分数来衡量胸片图像与放射学报告之间的相似度，用于报告检索。X-REM 增加了零错误报告的数量并降低了平均错误严重程度。

**技术模块**：Image-Text Matching, Retrieval-based Report Generation, Contrastive Learning, Chest X-Ray

---

## 7. WDM: 3D Wavelet Diffusion Models for High-Resolution Medical Image Synthesis

| 字段 | 内容 |
|------|------|
| **作者** | Paul Friedrich, Julia Wolleb, Florentin Bieder, Alicia Durrer, Philippe C. Cattin |
| **会议/期刊** | MICCAI 2024 (DGM4MICCAI) |
| **日期** | 2024-02-29 |
| **引用数** | 79 |
| **arXiv** | https://arxiv.org/pdf/2402.19043.pdf |
| **主题方向** | 高分辨率医学图像生成 / 超分辨率 |

**摘要**：WDM 是基于小波的医学图像合成框架，将扩散模型应用于小波分解后的图像。该方法能生成高达 256×256×256 分辨率的高质量 3D 医学图像，超越了所有对比方法。这在高分辨率/超分辨率医学图像生成方面具有代表性意义。

**技术模块**：3D Wavelet Decomposition, Diffusion Models, High-Resolution Medical Image Synthesis, 256³ Resolution

---

## 8. Cascaded Latent Diffusion Models for High-Resolution Chest X-Ray Synthesis (Cheff)

| 字段 | 内容 |
|------|------|
| **作者** | Tobias Weber, Michael Ingrisch, Bernd Bischl, David Rügamer |
| **会议/期刊** | PAKDD 2023 |
| **日期** | 2023-03-20 |
| **引用数** | 49 |
| **arXiv** | https://arxiv.org/pdf/2303.11224.pdf |
| **主题方向** | 胸片图像生成 / 扩散模型 |

**摘要**：提出了 Cheff——一个基础级联潜在扩散模型，可生成高度逼真的胸片图像，在 1 兆像素尺度上提供最先进的质量。该工作统一了公共胸部 X 光数据集的接口，构成了目前最大的开放胸片数据集集合，是胸片生成方向的代表性成果。

**技术模块**：Cascaded Latent Diffusion, High-Resolution Chest X-Ray Synthesis, 1-Megapixel Scale, Multi-Dataset Training

---

## 汇总统计

| 维度 | 数据 |
|------|------|
| **论文总数** | 8 |
| **期刊/会议分布** | Nature BME ×1, CVPR ×1, MICCAI ×2, Medical Physics ×1, IEEE JBHI ×1, MIDL ×1, PAKDD ×1 |
| **年份分布** | 2023 ×4, 2024 ×4 |
| **总引用数** | 926 |
| **平均引用数** | 115.8 |
| **主题覆盖** | 胸片生成 ×3, 报告生成 ×2, CT 生成 ×1, 高分辨率/超分辨率 ×1, 医学图像生成 ×1 |
| **中文文献** | 未在 Semantic Scholar 高引区检索到中文学术论文（中文文献建议在 CNKI/万方检索） |

> **说明**：8 篇论文涵盖了扩散模型在胸片生成、CT 影像转换、报告生成和高分辨率合成中的代表性应用。中文文献在 Semantic Scholar 覆盖较少，建议补充检索 CNKI 或万方数据库。
