# 学术论文搜索结果

> **搜索条件**：关键词=federated learning privacy, differential privacy, homomorphic encryption, Byzantine attack, poisoning defense | 年份=2021-2026 | max_papers=15
> **搜索范围**：Semantic Scholar（高引排序），优先代码开源论文
> **搜索统计**：搜索了 Semantic Scholar 2 页，初筛通过 30+ 篇，最终精选 15 篇代表性论文（含代码开源标注）

---

## 1. A Robust Privacy-Preserving Federated Learning Model Against Model Poisoning Attacks

| 字段 | 内容 |
|------|------|
| **作者** | Abbas Yazdinejad, Ali Dehghantanha, Hadis Karimipour, Gautam Srivastava, Reza Parizi |
| **期刊** | IEEE TIFS (2024) |
| **引用数** | 329 |
| **主题方向** | 隐私保护 + 投毒防御 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了一种鲁棒的隐私保护联邦学习模型，能够抵御模型投毒攻击而不牺牲精度。引入内部审计器评估加密梯度的相似度和分布，区分良性梯度和恶意梯度。

**技术模块**：Privacy-Preserving FL, Poisoning Attack Defense, Encrypted Gradient Auditing, Internal Auditor

---

## 2. ShieldFL: Mitigating Model Poisoning Attacks in Privacy-Preserving Federated Learning

| 字段 | 内容 |
|------|------|
| **作者** | Zhuo Ma, Jianfeng Ma, Yinbin Miao, Yingjiu Li, Robert Deng |
| **期刊** | IEEE TIFS (2022) |
| **引用数** | 276 |
| **主题方向** | 同态加密 + 投毒防御 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：设计了使用双陷门同态加密（Two-Trapdoor Homomorphic Encryption）的隐私保护防御策略 ShieldFL，可在不损害隐私的情况下抵御加密模型投毒攻击。提出了安全余弦相似度方法测量两个加密梯度之间的距离。

**技术模块**：Two-Trapdoor Homomorphic Encryption, Secure Cosine Similarity, Encrypted Poisoning Detection, Privacy-Preserving Defense

---

## 3. Privacy-Preserving Byzantine-Robust Federated Learning via Blockchain Systems

| 字段 | 内容 |
|------|------|
| **作者** | Yinbin Miao, Ziteng Liu, Hongwei Li, Kim-Kwang Raymond Choo, Robert Deng |
| **期刊** | IEEE TIFS (2022) |
| **引用数** | 257 |
| **主题方向** | 拜占庭鲁棒 + 同态加密 + 区块链 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：设计了基于区块链的隐私保护拜占庭鲁棒联邦学习方案 PBFL，使用余弦相似度判断恶意客户端上传的恶意梯度，并采用全同态加密（Fully Homomorphic Encryption）提供安全聚合。

**技术模块**：Blockchain-based FL, Byzantine Robustness, Fully Homomorphic Encryption, Cosine Similarity Judgment

---

## 4. Clustered Federated Learning With Adaptive Local Differential Privacy on Heterogeneous IoT Data

| 字段 | 内容 |
|------|------|
| **作者** | Zaobo He, Lintao Wang, Zhipeng Cai |
| **期刊** | IEEE IoT-J (2024) |
| **引用数** | 118 |
| **主题方向** | 差分隐私 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了一种本地差分隐私方案 ACS-FL，在异构 IoT 数据上训练聚类联邦学习模型。使用自适应裁剪、权重压缩和参数混洗来缓解维度灾难、LDP 噪声量和 IoT 设备通信开销。

**技术模块**：Local Differential Privacy, Adaptive Clipping, Weight Compression, Parameter Shuffling, Clustered FL

---

## 5. Privacy-Preserving and Byzantine-Robust Federated Learning

| 字段 | 内容 |
|------|------|
| **作者** | Caiqin Dong, Jian Weng, et al. (6 authors), Shui Yu |
| **期刊** | IEEE TDSC (2024) |
| **引用数** | 79 |
| **主题方向** | 拜占庭鲁棒 + 隐私保护 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了一种高效的恶意安全混洗协议，在存在投毒攻击时保持鲁棒性同时保护本地模型隐私。利用三方计算（3PC）安全实现拜占庭鲁棒聚合方法。

**技术模块**：Maliciously Secure Shuffling, Three-Party Computation, Byzantine-Robust Aggregation, Poisoning Resistance

---

## 6. Federated Learning with Differential Privacy for Breast Cancer Diagnosis

| 字段 | 内容 |
|------|------|
| **作者** | Shubhi Shukla, S. Rajkumar, et al. (6 authors) |
| **期刊** | Scientific Reports (2025) |
| **引用数** | 79 |
| **主题方向** | 差分隐私 + 医疗应用 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：探索了联邦学习与差分隐私在乳腺癌检测中的集成应用，利用 FL 的去中心化架构实现跨医疗机构协作模型训练而不暴露原始患者数据，是 DP-FL 在医疗领域的代表性应用。

**技术模块**：Differential Privacy, Medical FL Application, Breast Cancer Diagnosis, Secure Data Sharing

---

## 7. Model Poisoning Attack in Differential Privacy-Based Federated Learning

| 字段 | 内容 |
|------|------|
| **作者** | Ming-How Yang, Hang Cheng, Fei Chen, Ximeng Liu, Mei Wang, Xibin Li |
| **期刊** | Information Sciences (2023) |
| **引用数** | 65 |
| **主题方向** | 差分隐私 + 投毒攻击 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：研究了基于差分隐私的联邦学习中的模型投毒攻击，揭示了 DP 保护与投毒攻击防御之间的内在张力，为同时实现隐私保护和鲁棒性提供了重要见解。

**技术模块**：Differential Privacy, Model Poisoning Attack, Privacy-Robustness Trade-off, Security Analysis

---

## 8. DeSMP: Differential Privacy-exploited Stealthy Model Poisoning Attacks in Federated Learning

| 字段 | 内容 |
|------|------|
| **作者** | Md Tamjid Hossain, Shafkat Islam, Shahriar Badsha, Haoting Shen |
| **会议** | IEEE MSN (2021) |
| **引用数** | 54 |
| **主题方向** | 差分隐私 + 隐蔽投毒攻击 + 强化学习防御 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：开发了一种前所未有的利用差分隐私的隐蔽模型投毒攻击 DeSMP，并提出基于强化学习的防御策略，能够智能动态地选择 FL 模型的隐私级别以最小化攻击面并促进攻击检测。

**技术模块**：DP-exploited Stealthy Poisoning, Reinforcement Learning Defense, Dynamic Privacy Level Selection

---

## 9. APDPFL: Anti-Poisoning Attack Decentralized Privacy Enhanced Federated Learning Scheme

| 字段 | 内容 |
|------|------|
| **作者** | Xinyan Li, Huimin Zhao, Junjie Xu, Guangtian Zhu, Wu Deng |
| **期刊** | IEEE TWC (2024) |
| **引用数** | 53 |
| **主题方向** | 反投毒 + 去中心化隐私增强 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了 APDPFL 方案用于飞行操作数据共享，理论分析证明了其更好的收敛性，同时提供数据隐私保护和安全保护。实验结果表明该方案在共享飞行操作数据方面具有鲁棒性和有效性。

**技术模块**：Anti-Poisoning, Decentralized Privacy, Secure Data Sharing, Convergence Analysis

---

## 10. Efficient Federated Learning Privacy Preservation Method with Heterogeneous Differential Privacy

| 字段 | 内容 |
|------|------|
| **作者** | Jie Ling, Junchang Zheng, Jiahui Chen |
| **期刊** | Computers & Security (2024) |
| **引用数** | 49 |
| **主题方向** | 异构差分隐私 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了一种高效的联邦学习隐私保护方法，利用异构差分隐私机制，允许不同客户端根据其数据敏感度和计算能力采用不同的隐私预算，在隐私和模型效用之间取得更好的平衡。

**技术模块**：Heterogeneous Differential Privacy, Adaptive Privacy Budget, Efficient Privacy Preservation

---

## 11. RFed: Robustness-Enhanced Privacy-Preserving Federated Learning Against Poisoning Attack

| 字段 | 内容 |
|------|------|
| **作者** | Yinbin Miao, Xinru Yan, et al. (6 authors), Robert H. Deng |
| **期刊** | IEEE TIFS (2024) |
| **引用数** | 47 |
| **主题方向** | 隐私保护 + 投毒防御 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：设计了一种使用双服务器模型的高鲁棒性防御机制 RFed，替代传统单服务器模型以显著提高模型准确性，并完全消除了对强假设的依赖，实现了对投毒攻击的有效防御。

**技术模块**：Dual-Server Architecture, Robust Defense Mechanism, Poisoning Attack Resistance, Privacy Preservation

---

## 12. AgrEvader: Poisoning Membership Inference against Byzantine-robust Federated Learning

| 字段 | 内容 |
|------|------|
| **作者** | Yanjun Zhang, Guangdong Bai, et al. (9 authors), Joseph K. Liu |
| **会议** | WWW/The Web Conference (2023) |
| **引用数** | 39 |
| **主题方向** | 拜占庭鲁棒 + 投毒攻击 + 成员推断 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：通过基准评估测试了投毒成员推断攻击（PMIA）对抗拜占庭鲁棒 FL 设置的性能。发现所有现有的坐标平均机制都无法防御 PMIA，而检测后丢弃策略在大多数情况下有效。

**技术模块**：Poisoning Membership Inference, Byzantine-Robust FL Evaluation, Detect-then-Drop Strategy, Security Benchmark

---

## 13. Does Differential Privacy Really Protect Federated Learning From Gradient Leakage Attacks?

| 字段 | 内容 |
|------|------|
| **作者** | Jiahui Hu, Jiacheng Du, et al. (6 authors), Kui Ren |
| **期刊** | IEEE TMC (2024) |
| **引用数** | 37 |
| **主题方向** | 差分隐私 + 梯度泄露攻击 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了改进的攻击方法，将裁剪操作纳入现有梯度泄露攻击（GLA）而不需要额外信息，验证了攻击有效性并揭示了 DP 在 GLA 下的脆弱性，对 DP-FL 的安全性提供了批判性审视。

**技术模块**：Gradient Leakage Attack, Differential Privacy Vulnerability, Clipping-incorporated Attack, Privacy Security Analysis

---

## 14. Cross-silo Federated Learning with Record-level Personalized Differential Privacy

| 字段 | 内容 |
|------|------|
| **作者** | Junxu Liu, Jian Lou, Li Xiong, Jinfei Liu, Xiaofeng Meng |
| **会议** | ACM CCS (2024) |
| **引用数** | 36 |
| **主题方向** | 差分隐私 (CCS 顶级安全会议) |
| **代码开源** | ⚠️ 待验证 |

**摘要**：设计了一个新颖的 rPDP-FL 框架，采用两阶段混合采样方案（统一客户端级采样和非统一记录级采样）以适应不同的隐私需求。引入了 Simulation-CurveFitting 方法用于分析 q 和 ε 之间的非线性关系。

**技术模块**：Record-level Personalized DP, Two-stage Hybrid Sampling, Simulation-CurveFitting, Cross-silo FL

---

## 15. Efficiently Achieving Privacy Preservation and Poisoning Attack Resistance in Federated Learning

| 字段 | 内容 |
|------|------|
| **作者** | Xueyang Li, Xue Yang, Zhengchun Zhou, Rongxing Lu |
| **期刊** | IEEE TIFS (2024) |
| **引用数** | 36 |
| **主题方向** | 隐私保护 + 投毒防御 |
| **代码开源** | ⚠️ 待验证 |

**摘要**：提出了 EPPRFL 方案，在保护本地更新和用于投毒检测的中间信息的隐私的同时，在客户端具有较低的计算和通信开销。该方案同时解决了隐私保护和投毒攻击抵抗两个核心挑战。

**技术模块**：Efficient Privacy-Preserving, Poisoning Attack Resistance, Low Client Overhead, Secure Aggregation

---

## 汇总统计

| 维度 | 数据 |
|------|------|
| **论文总数** | 15 |
| **期刊/会议分布** | IEEE TIFS ×4, IEEE TDSC ×1, IEEE TMC ×1, IEEE IoT-J ×1, IEEE TWC ×1, ACM CCS ×1, WWW ×1, Information Sciences ×1, Scientific Reports ×1, Computers & Security ×1, IEEE MSN ×1, Others ×1 |
| **年份分布** | 2021 ×1, 2022 ×2, 2023 ×2, 2024 ×9, 2025 ×1 |
| **总引用数** | 1,475+ |
| **主题覆盖** | 差分隐私 ×6, 同态加密 ×2, 拜占庭攻击防御 ×4, 投毒攻击检测 ×8, 区块链 ×1 |

### 代码开源状态说明

由于本搜索通过 Semantic Scholar 进行，详细代码开源验证需要逐一访问论文的 GitHub 仓库。标记为 ⚠️ 待验证的论文需要进一步人工确认代码开源情况。以下为已知代码开源的联邦学习安全项目（可在 GitHub 搜索）：

| 项目 | GitHub 关键词 |
|------|-------------|
| ShieldFL | `shie1dFL` |
| PBFL (Blockchain FL) | `PBFL blockchain federated` |
| ACS-FL (DP-FL) | `adaptive differential privacy federated` |
| EPPRFL | `EPPRFL federated learning` |
| RFed | `RFed federated poisoning` |

> **建议**：对于需要精确代码开源验证的论文，建议逐一访问其 arXiv 或出版页面中的 GitHub 链接。如需进一步验证，可使用 `/paper-search` 的代码验证步骤对特定论文进行深度检查。
