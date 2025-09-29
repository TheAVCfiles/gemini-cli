# Serverless model catalog

Gemini CLI can route requests to Together AI's serverless endpoints. This page lists the chat, image, vision, audio, code, embedding, rerank, language, and moderation models that are currently available together with the model string that you pass to the API, the maximum context window, and (where available) the quantization or default generation parameters.

## Chat models

> Models marked as "Turbo" are quantized to FP8 and those marked as "Lite" are INT4. All other models are served at full precision (FP16 or BF16).

If you are not sure which model to start with, we recommend **Llama 3.3 70B Turbo** (`meta-llama/Llama-3.3-70B-Instruct-Turbo`).

| Organization | Model Name | API Model String | Context length | Quantization |
| :-- | :-- | :-- | :-- | :-- |
| Moonshot | Kimi K2 Instruct 0905 | moonshotai/Kimi-K2-Instruct-0905 | 262144 | FP8 |
| DeepSeek | DeepSeek-V3.1 | deepseek-ai/DeepSeek-V3.1 | 128000 | FP8 |
| OpenAI | GPT-OSS 120B | openai/gpt-oss-120b | 128000 | MXFP4 |
| OpenAI | GPT-OSS 20B | openai/gpt-oss-20b | 128000 | MXFP4 |
| Moonshot | Kimi K2 Instruct | moonshotai/Kimi-K2-Instruct | 128000 | FP8 |
| Z.ai | GLM 4.5 Air | zai-org/GLM-4.5-Air-FP8 | 131072 | FP8 |
| Qwen | Qwen3 235B-A22B Thinking 2507 | Qwen/Qwen3-235B-A22B-Thinking-2507 | 262144 | FP8 |
| Qwen | Qwen3-Coder 480B-A35B Instruct | Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8 | 256000 | FP8 |
| Qwen | Qwen3 235B-A22B Instruct 2507 | Qwen/Qwen3-235B-A22B-Instruct-2507-tput | 262144 | FP8 |
| Qwen | Qwen3-Next-80B-A3B-Instruct | Qwen/Qwen3-Next-80B-A3B-Instruct | 262144 | BF16 |
| Qwen | Qwen3-Next-80B-A3B-Thinking | Qwen/Qwen3-Next-80B-A3B-Thinking | 262144 | BF16 |
| DeepSeek | DeepSeek-R1-0528 | deepseek-ai/DeepSeek-R1 | 163839 | FP8 |
| DeepSeek | DeepSeek-R1-0528 Throughput | deepseek-ai/DeepSeek-R1-0528-tput | 163839 | FP8 |
| DeepSeek | DeepSeek-V3-0324 | deepseek-ai/DeepSeek-V3 | 163839 | FP8 |
| Meta | Llama 4 Maverick (17Bx128E) | meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 | 1048576 | FP8 |
| Meta | Llama 4 Scout (17Bx16E) | meta-llama/Llama-4-Scout-17B-16E-Instruct | 1048576 | FP16 |
| Meta | Llama 3.3 70B Instruct Turbo | meta-llama/Llama-3.3-70B-Instruct-Turbo | 131072 | FP8 |
| Deep Cogito | Cogito v2 Preview 70B | deepcogito/cogito-v2-preview-llama-70B | 32768 | BF16 |
| Deep Cogito | Cogito v2 Preview 109B MoE | deepcogito/cogito-v2-preview-llama-109B-MoE | 32768 | BF16 |
| Deep Cogito | Cogito v2 Preview 405B | deepcogito/cogito-v2-preview-llama-405B | 32768 | BF16 |
| Deep Cogito | Cogito v2 Preview 671B MoE | deepcogito/cogito-v2-preview-deepseek-671b | 32768 | FP8 |
| Mistral AI | Magistral Small 2506 API | mistralai/Magistral-Small-2506 | 40960 | BF16 |
| DeepSeek | DeepSeek R1 Distill Llama 70B | deepseek-ai/DeepSeek-R1-Distill-Llama-70B | 131072 | FP16 |
| DeepSeek | DeepSeek R1 Distill Qwen 14B | deepseek-ai/DeepSeek-R1-Distill-Qwen-14B | 131072 | FP16 |
| Marin Community | Marin 8B Instruct | marin-community/marin-8b-instruct | 4096 | FP16 |
| Mistral AI | Mistral Small 3 Instruct (24B) | mistralai/Mistral-Small-24B-Instruct-2501 | 32768 | FP16 |
| Meta | Llama 3.1 8B Instruct Turbo | meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo | 131072 | FP8 |
| Meta | Llama 3.3 70B Instruct Turbo (Free)** | meta-llama/Llama-3.3-70B-Instruct-Turbo-Free | 131072 | FP8 |
| Qwen | Qwen 2.5 7B Instruct Turbo | Qwen/Qwen2.5-7B-Instruct-Turbo | 32768 | FP8 |
| Qwen | Qwen 2.5 72B Instruct Turbo | Qwen/Qwen2.5-72B-Instruct-Turbo | 32768 | FP8 |
| Qwen | Qwen2.5 Vision Language 72B Instruct | Qwen/Qwen2.5-VL-72B-Instruct | 32768 | FP8 |
| Qwen | Qwen 2.5 Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | 32768 | FP16 |
| Qwen | QwQ-32B | Qwen/QwQ-32B | 32768 | FP16 |
| Qwen | Qwen3 235B A22B Throughput | Qwen/Qwen3-235B-A22B-fp8-tput | 40960 | FP8 |
| Arcee | Arcee AI Virtuoso Medium | arcee-ai/virtuoso-medium-v2 | 128000 | - |
| Arcee | Arcee AI Coder-Large | arcee-ai/coder-large | 32768 | - |
| Arcee | Arcee AI Virtuoso-Large | arcee-ai/virtuoso-large | 128000 | - |
| Arcee | Arcee AI Maestro | arcee-ai/maestro-reasoning | 128000 | - |
| Arcee | Arcee AI Caller | arcee-ai/caller | 32768 | - |
| Arcee | Arcee AI Blitz | arcee-ai/arcee-blitz | 32768 | - |
| Meta | Llama 3.1 405B Instruct Turbo | meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo | 130815 | FP8 |
| Meta | Llama 3.2 3B Instruct Turbo | meta-llama/Llama-3.2-3B-Instruct-Turbo | 131072 | FP16 |
| Meta | Llama 3 8B Instruct Lite | meta-llama/Meta-Llama-3-8B-Instruct-Lite | 8192 | INT4 |
| Meta | Llama 3 70B Instruct Reference | meta-llama/Llama-3-70b-chat-hf | 8192 | FP16 |
| Google | Gemma Instruct (2B) | google/gemma-2b-it* | 8192 | FP16 |
| Google | Gemma 3N E4B Instruct | google/gemma-3n-E4B-it | 32768 | FP8 |
| Gryphe | MythoMax-L2 (13B) | Gryphe/MythoMax-L2-13b* | 4096 | FP16 |
| Mistral AI | Mistral (7B) Instruct | mistralai/Mistral-7B-Instruct-v0.1 | 8192 | FP16 |
| Mistral AI | Mistral (7B) Instruct v0.2 | mistralai/Mistral-7B-Instruct-v0.2 | 32768 | FP16 |
| Mistral AI | Mistral (7B) Instruct v0.3 | mistralai/Mistral-7B-Instruct-v0.3 | 32768 | FP16 |

**The free version of Llama 3.3 70B Instruct Turbo has a reduced rate limit of 6 requests/minute for users on the free tier and 10 requests/minute for all other build tiers.**

## Image models

Use the [Images endpoint](/reference/post-images-generations) for image generation.

| Organization | Model Name | Model String | Default steps |
| :-- | :-- | :-- | :-- |
| Black Forest Labs | Flux.1 [schnell] (free)* | black-forest-labs/FLUX.1-schnell-Free | N/A |
| Black Forest Labs | Flux.1 [schnell] (Turbo) | black-forest-labs/FLUX.1-schnell | 4 |
| Black Forest Labs | Flux.1 Dev | black-forest-labs/FLUX.1-dev | 28 |
| Black Forest Labs | Flux1.1 [pro] | black-forest-labs/FLUX.1.1-pro | - |
| Black Forest Labs | Flux.1 [pro] | black-forest-labs/FLUX.1-pro | 28 |
| Black Forest Labs | Flux .1 Kontext [pro] | black-forest-labs/FLUX.1-kontext-pro | 28 |
| Black Forest Labs | Flux .1 Kontext [max] | black-forest-labs/FLUX.1-kontext-max | 28 |
| Black Forest Labs | Flux .1 Kontext [dev] | black-forest-labs/FLUX.1-kontext-dev | 28 |
| Black Forest Labs | FLUX .1 Krea [dev] | black-forest-labs/FLUX.1-krea-dev | 28 |

**Note:** Due to high demand, FLUX.1 [schnell] Free has a model-specific rate limit of 10 images per minute. Flux Pro 1, Flux Pro 1.1, Flux .1 Kontext [pro], and Flux .1 Kontext [max] require Build Tier 2 or above. Flux models can only be used with credits and cannot be called when the balance is zero or negative. The free Schnell variant has lower rate limits and performance than the paid Turbo endpoint.

### FLUX pricing

For Flux models (except Pro), pricing is based on the size of generated images (in megapixels) and the number of steps used if you go above the default. Costs are calculated with:

```
Cost = MP × Price per MP × (Steps ÷ Default Steps)
```

Where:

- `MP = (Width × Height ÷ 1,000,000)`
- `Price per MP` is the listed price at the default step count
- `Steps` is only factored in when the request exceeds the default number of steps

Using fewer steps than the default does **not** reduce the cost.

## Vision models

If you are not sure which model to use, start with **Llama 4 Scout** (`meta-llama/Llama-4-Scout-17B-16E-Instruct`).

| Organization | Model Name | Model String | Context length |
| :-- | :-- | :-- | :-- |
| Meta | Llama 4 Maverick (17Bx128E) | meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 | 524288 |
| Meta | Llama 4 Scout (17Bx16E) | meta-llama/Llama-4-Scout-17B-16E-Instruct | 327680 |
| Qwen | Qwen2.5 Vision Language 72B Instruct | Qwen/Qwen2.5-VL-72B-Instruct | 32768 |
| Arcee | Arcee AI Spotlight | arcee_ai/arcee-spotlight | 128000 |

## Audio models

Use the [Audio endpoint](/reference/audio-speech) for text-to-speech and the transcription/translation endpoints for ASR.

| Organization | Modality | Model Name | Model String |
| :-- | :-- | :-- | :-- |
| Cartesia | Text-to-Speech | Cartesia Sonic 2 | cartesia/sonic-2 |
| Cartesia | Text-to-Speech | Cartesia Sonic | cartesia/sonic |
| OpenAI | Speech-to-Text | Whisper Large v3 | openai/whisper-large-v3 |

## Code models

Use the [Completions endpoint](/reference/completions-1) for code generation models.

| Organization | Model Name | Model String | Context length |
| :-- | :-- | :-- | :-- |
| Qwen | Qwen 2.5 Coder 32B Instruct | Qwen/Qwen2.5-Coder-32B-Instruct | 32768 |

## Embedding models

| Model Name | Model String | Size | Embedding dimension | Context window |
| :-- | :-- | :-- | :-- | :-- |
| M2-BERT-80M-32K-Retrieval | togethercomputer/m2-bert-80M-32k-retrieval | 80M | 768 | 32768 |
| BGE-Large-EN-v1.5 | BAAI/bge-large-en-v1.5 | 326M | 1024 | 512 |
| BGE-Base-EN-v1.5 | BAAI/bge-base-en-v1.5 | 102M | 768 | 512 |
| GTE-Modernbert-base | Alibaba-NLP/gte-modernbert-base | 149M | 768 | 8192 |
| Multilingual-e5-large-instruct | intfloat/multilingual-e5-large-instruct | 560M | 1024 | 514 |

## Rerank models

Use the [Rerank API](/docs/rerank-overview) to re-order search results or retrieval candidates.

| Organization | Model Name | Model Size | Model String | Max Doc Size (tokens) | Max Docs |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Salesforce | LlamaRank | 8B | Salesforce/Llama-Rank-v1 | 8192 | 1024 |
| MixedBread | Rerank Large | 1.6B | mixedbread-ai/Mxbai-Rerank-Large-V2 | 32768 | - |

## Language models

Use the [Completions endpoint](/reference/completions-1) for non-chat language model prompts.

| Organization | Model Name | Model String | Context length |
| :-- | :-- | :-- | :-- |
| Meta | LLaMA-2 (70B) | meta-llama/Llama-2-70b-hf | 4096 |
| mistralai | Mixtral-8x7B (46.7B) | mistralai/Mixtral-8x7B-v0.1 | 32768 |

## Moderation models

Moderation models can run as standalone classifiers or as safety filters for other models via the `safety_model` parameter.

| Organization | Model Name | Model String | Context length |
| :-- | :-- | :-- | :-- |
| Meta | Llama Guard (8B) | meta-llama/Meta-Llama-Guard-3-8B | 8192 |
| Meta | Llama Guard 4 (12B) | meta-llama/Llama-Guard-4-12B | 1048576 |
| Virtue AI | Virtue Guard | VirtueAI/VirtueGuard-Text-Lite | 32768 |

## Example integrations

Explore these public applications and notebooks for inspiration:

- [PDF to Chat App](https://www.pdftochat.com/) — chat with local documents like blogs, textbooks, and papers.
- [Open Deep Research Notebook](https://github.com/togethercomputer/together-cookbook/blob/main/Agents/Together_Open_Deep_Research_CookBook.ipynb) — generate long-form reports from a single prompt.
- [RAG with Reasoning Models Notebook](https://github.com/togethercomputer/together-cookbook/blob/main/RAG_with_Reasoning_Models.ipynb) — retrieval augmented generation with DeepSeek-R1.
- [Fine-tuning Chat Models Notebook](https://github.com/togethercomputer/together-cookbook/blob/main/Finetuning/Finetuning_Guide.ipynb) — tune language models for conversation.
- [Building Agents](https://github.com/togethercomputer/together-cookbook/tree/main/Agents) — orchestrate agent workflows with language models.
- [Blinkshot.io](https://www.blinkshot.io/) — realtime Flux Schnell playground.
- [Logo Creator](https://www.logo-creator.io/) — generate professional logos with Flux Pro 1.1.
- [PicMenu](https://www.picmenu.co/) — visualise restaurant menus with Flux image models.
- [Flux LoRA Inference Notebook](https://github.com/togethercomputer/together-cookbook/blob/main/Flux_LoRA_Inference.ipynb) — run LoRA fine-tuned Flux image models.
- [LlamaOCR](https://llamaocr.com/) — document OCR that outputs Markdown.
- [Wireframe to Code](https://www.napkins.dev/) — turn UI mockups into React code.
- [Structured text extraction from images](https://github.com/togethercomputer/together-cookbook/blob/main/Structured_Text_Extraction_from_Images.ipynb) — extract structured data as JSON.
- [PDF to Podcast](https://github.com/togethercomputer/together-cookbook/blob/main/PDF_to_Podcast.ipynb) — generate podcasts from PDFs.
- [Audio Podcast Agent Workflow](https://github.com/togethercomputer/together-cookbook/blob/main/Agents/Serial_Chain_Agent_Workflow.ipynb) — create audio files from content inputs.
- [LlamaCoder](https://llamacoder.together.ai) — generate small apps with Llama 3 405B.
- [Code Generation Agent](https://github.com/togethercomputer/together-cookbook/blob/main/Agents/Looping_Agent_Workflow.ipynb) — build iterative code generation agents.
- [Contextual RAG](https://docs.together.ai/docs/how-to-implement-contextual-rag-from-anthropic) — implement contextual retrieval augmentation.
- [Multimodal Search and Conditional Image Generation](https://github.com/togethercomputer/together-cookbook/blob/main/Multimodal_Search_and_Conditional_Image_Generation.ipynb) — search for images and generate similar ones.
- [Embedding visualisation](https://github.com/togethercomputer/together-cookbook/blob/main/Embedding_Visualization.ipynb) — visualise and cluster vector embeddings.
- [Search with reranking](https://github.com/togethercomputer/together-cookbook/blob/main/Search_with_Reranking.ipynb) — combine semantic search with reranking.
- [Open Contextual RAG](https://github.com/togethercomputer/together-cookbook/blob/main/Open_Contextual_RAG.ipynb) — hybrid search with reranking.

\* Deprecated models remain available until removal; see the [Deprecations](/docs/deprecations) page for details.

