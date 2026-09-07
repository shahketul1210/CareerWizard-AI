import uuid
import json
from datetime import datetime, timedelta
from app.db.database import SessionLocal, Base, engine
from app.models.internship_track import InternshipTrack
from app.models.internship_plan import InternshipPlan
from app.models.internship_task import InternshipTask
from app.models.day_content import DayContent
from app.models.enrollment import Enrollment
from app.models.task_submission import TaskSubmission
from app.models.certificate import Certificate
from app.models.payment import Payment
from app.models.user import User
from app.models.user_profile import StudentProfile
from app.models.admin import Admin
from app.models.activity import UserActivity

AI_ML_TASKS = [
    {
        "day": 1,
        "phase": 1,
        "title": "Machine Learning Environment & NumPy Vectorization",
        "description": "Establish your Python machine learning workbench. Benchmark matrix operations using vectorized NumPy arrays against standard Python loops to understand memory locality and high-performance tensor computing.",
        "beginner_reqs": [
            "Install Python 3.10+, NumPy, Pandas, Matplotlib, and Scikit-Learn in a virtual environment",
            "Create 1D, 2D, and 3D NumPy arrays and demonstrate broadcasting rules",
            "Perform element-wise arithmetic, dot products, and matrix inversions",
            "Calculate summary statistics (mean, variance, standard deviation, percentiles)",
            "Push setup verification script and README to a public GitHub repository"
        ],
        "inter_reqs": [
            "Benchmark matrix multiplication (1000x1000) comparing pure Python loops vs NumPy dot product",
            "Demonstrate advanced boolean indexing, masking, and fancy slicing",
            "Generate synthetic Gaussian datasets with specific covariance matrices",
            "Implement custom Min-Max Normalization and Z-score standardization using only NumPy",
            "Document time complexity and cache hierarchy advantages in README.md"
        ],
        "advanced_reqs": [
            "Implement a memory-efficient matrix processing pipeline utilizing NumPy memory maps (np.memmap)",
            "Benchmark SIMD vectorization speedup using Numba @jit and NumPy vectorization",
            "Implement linear equation solver using Singular Value Decomposition (np.linalg.svd)",
            "Setup Docker container with automated GPU/CPU environment configuration",
            "Write pytest unit tests covering numerical stability and edge cases"
        ],
        "tech_tags": ["Python 3.10+", "NumPy", "Linear Algebra", "Vectorization", "Jupyter"],
        "resources": [
            {"title": "NumPy Full Course — Vectorization & Broadcasting", "subtitle": "YouTube · 45 min · Essential", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=QUT1VHiLmmI"},
            {"title": "NumPy Official Documentation & API Reference", "subtitle": "Official Docs · Reference", "icon": "fa-solid fa-book", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://numpy.org/doc/stable/"},
            {"title": "NumPy ML Starter Template", "subtitle": "GitHub · Clone Ready", "icon": "fa-brands fa-github", "bg": "bg-blue-50 text-blue-600 border border-blue-100", "link": "https://github.com"}
        ],
        "expected_output": "A reproducible Python notebook / script comparing vectorization speeds with clean console benchmarks and unit tests."
    },
    {
        "day": 2,
        "phase": 1,
        "title": "Exploratory Data Analysis (EDA) & Data Visualization",
        "description": "Ingest tabular real-world datasets into Pandas. Perform univariate, bivariate, and multivariate analysis to expose underlying statistical patterns, skewness, missingness, and anomalous outliers.",
        "beginner_reqs": [
            "Load California Housing or Titanic dataset into Pandas DataFrame",
            "Inspect schema with df.info(), df.describe(), and df.shape",
            "Generate distribution histograms and boxplots using Matplotlib",
            "Create scatter plots identifying relationships between features and target",
            "Document initial findings and data dictionary in README.md"
        ],
        "inter_reqs": [
            "Detect outliers using Interquartile Range (IQR) and Z-score thresholds",
            "Generate Seaborn correlation heatmaps with Pearson and Spearman coefficients",
            "Implement automated missing value profiling and visualization (missingno)",
            "Perform group-by aggregations revealing demographic segment differences",
            "Apply log transforms to heavily right-skewed numerical distributions"
        ],
        "advanced_reqs": [
            "Build an interactive Plotly dashboard for multi-dimensional data exploration",
            "Conduct formal hypothesis tests (t-test, ANOVA, Chi-square test of independence)",
            "Compute Variance Inflation Factor (VIF) to detect multicollinearity between predictors",
            "Export structured EDA summary report in Markdown and HTML",
            "Create reusable EDA class module with clean Object-Oriented design"
        ],
        "tech_tags": ["Pandas", "Matplotlib", "Seaborn", "Plotly", "Statistical EDA"],
        "resources": [
            {"title": "Comprehensive EDA with Pandas & Seaborn", "subtitle": "YouTube · 35 min · Highly Recommended", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=-o3AxdVcUtQ"},
            {"title": "Pandas Data Wrangling Cheat Sheet", "subtitle": "PDF Guide · Quick Reference", "icon": "fa-solid fa-file-pdf", "bg": "bg-purple-50 text-purple-600 border border-purple-100", "link": "https://pandas.pydata.org"}
        ],
        "expected_output": "A comprehensive EDA report with correlation heatmaps, distribution plots, and statistical anomaly insights."
    },
    {
        "day": 3,
        "phase": 1,
        "title": "Data Preprocessing & Feature Engineering Pipelines",
        "description": "Construct robust, leak-free Scikit-Learn data transformation pipelines. Address missing values, encode high-cardinality categorical features, and generate non-linear interaction terms.",
        "beginner_reqs": [
            "Split datasets cleanly into train and test sets prior to any preprocessing",
            "Impute missing numerical values using SimpleImputer (median strategy)",
            "Encode categorical variables using OneHotEncoder and OrdinalEncoder",
            "Scale numerical features using StandardScaler and MinMaxScaler",
            "Verify no target leakage occurs across training and validation splits"
        ],
        "inter_reqs": [
            "Assemble transformations into Scikit-Learn ColumnTransformer and Pipeline",
            "Handle high-cardinality categories using Target Encoding with cross-validation smoothing",
            "Apply IterativeImputer (MICE) and KNNImputer for complex missing data patterns",
            "Engineer interaction terms and polynomial feature combinations",
            "Serialize fitted preprocessing pipelines using Joblib"
        ],
        "advanced_reqs": [
            "Write custom Scikit-Learn Transformers inheriting from BaseEstimator and TransformerMixin",
            "Implement automated domain-specific feature extractors (date parts, geospatial distance)",
            "Apply automated feature selection using Mutual Information and Recursive Feature Elimination (RFE)",
            "Build unit tests ensuring pipeline idempotent behavior on edge cases and unseen categories",
            "Benchmark pipeline throughput on 100,000+ row synthetic datasets"
        ],
        "tech_tags": ["Scikit-Learn", "Pipeline", "ColumnTransformer", "Feature Engineering"],
        "resources": [
            {"title": "Scikit-Learn Pipeline Masterclass", "subtitle": "YouTube · 30 min · Essential", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=q6JvQx7hT6E"},
            {"title": "Feature Engineering Best Practices", "subtitle": "Article · Scikit-Learn Docs", "icon": "fa-solid fa-newspaper", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://scikit-learn.org/stable/modules/preprocessing.html"}
        ],
        "expected_output": "A production Scikit-Learn ColumnTransformer pipeline exporting clean training/test tensors with zero data leakage."
    },
    {
        "day": 4,
        "phase": 1,
        "title": "Supervised Learning — Regression & Regularization",
        "description": "Implement continuous prediction models. Compare Ordinary Least Squares against Ridge (L2), Lasso (L1), and ElasticNet regularization to penalize model complexity and prevent overfitting.",
        "beginner_reqs": [
            "Train a LinearRegression model on tabular housing/salary data",
            "Compute Mean Absolute Error (MAE), Mean Squared Error (MSE), and R² Score",
            "Plot actual vs predicted target values with 45-degree reference line",
            "Examine model coefficients and intercept values",
            "Explain variance explained by the model in plain language"
        ],
        "inter_reqs": [
            "Fit Ridge and Lasso regressors and plot coefficient shrinkage across alpha paths",
            "Perform 5-fold cross-validation using RidgeCV and LassoCV for optimal penalty tuning",
            "Plot residual distributions and check for homoscedasticity assumptions",
            "Identify zeroed-out features in Lasso regression for automated feature selection",
            "Compare performance across R², Adjusted R², and Root Mean Squared Log Error (RMSLE)"
        ],
        "advanced_reqs": [
            "Implement Batch Gradient Descent and Stochastic Gradient Descent from scratch in pure NumPy",
            "Fit ElasticNet regression with simultaneous L1 and L2 grid search",
            "Analyze condition number of feature matrix to diagnose collinearity sensitivity",
            "Implement robust regression (Huber Regressor / RANSAC) to resist extreme outliers",
            "Package model evaluation into automated visual reports with residual Q-Q plots"
        ],
        "tech_tags": ["Linear Regression", "Ridge", "Lasso", "ElasticNet", "OLS", "Residual Analysis"],
        "resources": [
            {"title": "Regularization: Ridge vs Lasso Explained Visually", "subtitle": "YouTube · 22 min · StatQuest", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=Q81RR3yKn30"},
            {"title": "Scikit-Learn Linear Models User Guide", "subtitle": "Official Docs · Deep Dive", "icon": "fa-solid fa-code", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://scikit-learn.org/stable/modules/linear_model.html"}
        ],
        "expected_output": "Tuned Ridge/Lasso models with coefficient analysis, residual diagnostic plots, and quantified test R² > 0.82."
    },
    {
        "day": 5,
        "phase": 1,
        "title": "Supervised Learning — Classification & Diagnostic Metrics",
        "description": "Build binary and multi-class probabilistic classifiers. Master diagnostic evaluation metrics including Precision, Recall, F1-Score, ROC-AUC, and Precision-Recall Curves on imbalanced datasets.",
        "beginner_reqs": [
            "Train LogisticRegression classifier on medical diagnosis or churn dataset",
            "Generate Confusion Matrix and Scikit-Learn classification_report",
            "Compute Accuracy, Precision, Recall, and F1-Score",
            "Plot ROC curve and compute Area Under Curve (AUC)",
            "Explain difference between Type I (False Positive) and Type II (False Negative) errors"
        ],
        "inter_reqs": [
            "Handle imbalanced classes using class_weight='balanced' and SMOTE oversampling",
            "Plot Precision-Recall Curve and choose optimal decision threshold for business goals",
            "Train multi-class classifier using One-vs-Rest (OvR) and Multinomial Logistic Regression",
            "Perform Brier score loss evaluation to measure probability calibration",
            "Analyze odds ratios by exponentiating logistic regression coefficients"
        ],
        "advanced_reqs": [
            "Implement Logistic Regression with Newton-Raphson optimization in pure NumPy",
            "Calibrate classifier output probabilities using Isotonic Regression and Platt Scaling",
            "Optimize classification threshold using custom cost-utility matrix reflecting false alarm penalties",
            "Implement multi-label classification evaluation with macro, micro, and weighted F1-scores",
            "Deploy automated test suite validating model prediction reproducibility"
        ],
        "tech_tags": ["Logistic Regression", "ROC-AUC", "Confusion Matrix", "SMOTE", "Precision-Recall"],
        "resources": [
            {"title": "ROC and AUC Explained Clearly", "subtitle": "YouTube · 16 min · StatQuest", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=4jRBRDbJemM"},
            {"title": "Handling Imbalanced Data in Python", "subtitle": "Imbalanced-Learn Guide", "icon": "fa-solid fa-scale-balanced", "bg": "bg-amber-50 text-amber-600 border border-amber-100", "link": "https://imbalanced-learn.org"}
        ],
        "expected_output": "A calibrated classifier with custom threshold tuning, confusion matrix heatmap, and ROC-AUC score > 0.88."
    },
    {
        "day": 6,
        "phase": 2,
        "title": "Tree-Based Models & Ensemble Learning (Random Forest & XGBoost)",
        "description": "Transition from linear paradigms to non-linear decision trees and ensemble methods. Understand Bagging, Boosting, Gini Impurity, and train state-of-the-art Random Forest and XGBoost classifiers.",
        "beginner_reqs": [
            "Train DecisionTreeClassifier and visualize tree nodes using plot_tree",
            "Train RandomForestClassifier with 100 estimators and evaluate on test set",
            "Inspect feature importances and rank top predictive features",
            "Tune max_depth to observe impact on training vs testing accuracy (overfitting)",
            "Summarize bagging mechanics in project README"
        ],
        "inter_reqs": [
            "Train XGBoost (XGBClassifier) and LightGBM models on identical benchmark dataset",
            "Compare execution speed, memory footprint, and test F1-scores between RF, XGB, and LGBM",
            "Tune key boosting hyperparameters (learning_rate, n_estimators, subsample, colsample_bytree)",
            "Plot learning curves with early stopping to prevent gradient boosting overfitting",
            "Generate permutation importance scores to validate feature significance without bias"
        ],
        "advanced_reqs": [
            "Construct a StackingClassifier combining XGBoost, LightGBM, and CatBoost with a LogisticRegression meta-model",
            "Implement SHAP (SHapley Additive exPlanations) summary and force plots to explain individual predictions",
            "Evaluate leaf-level decision paths and build model export script",
            "Optimize tree inference latency using ONNX runtime export",
            "Set up automated benchmark regression tests comparing model iterations"
        ],
        "tech_tags": ["Decision Trees", "Random Forest", "XGBoost", "LightGBM", "SHAP", "Ensemble"],
        "resources": [
            {"title": "XGBoost Algorithm Explained in Depth", "subtitle": "YouTube · 24 min · Highly Recommended", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=OtD8wVaFm6E"},
            {"title": "XGBoost Python API Documentation", "subtitle": "Official Docs · Reference", "icon": "fa-solid fa-bolt", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://xgboost.readthedocs.io"}
        ],
        "expected_output": "High-performance ensemble model with SHAP interpretability plots and test F1-score > 0.90."
    },
    {
        "day": 7,
        "phase": 2,
        "title": "Hyperparameter Optimization & Robust Cross-Validation",
        "description": "Systematize model tuning. Master Stratified K-Fold cross-validation, Grid Search, Randomized Search, and state-of-the-art Bayesian optimization with Optuna to squeeze peak performance.",
        "beginner_reqs": [
            "Implement 5-Fold Stratified Cross-Validation on classification model",
            "Record mean accuracy and standard deviation across all 5 validation splits",
            "Tune 2 hyperparameters using Scikit-Learn GridSearchCV",
            "Plot validation scores across parameter ranges",
            "Document best parameters and final test score in README"
        ],
        "inter_reqs": [
            "Perform RandomizedSearchCV across a wide parameter space with continuous distributions",
            "Implement repeated cross-validation (RepeatedStratifiedKFold) to assess stability",
            "Integrate hyperparameter search directly inside Scikit-Learn Pipeline to prevent leakage",
            "Analyze search runtimes and efficiency trade-offs between Grid and Random Search",
            "Save best estimator and parameter configurations to JSON artifacts"
        ],
        "advanced_reqs": [
            "Implement Bayesian Hyperparameter Optimization using Optuna with TPE sampler",
            "Define multi-objective optimization (maximize F1-score while minimizing inference latency in ms)",
            "Visualize Optuna optimization history, contour plots, and slice plots",
            "Implement automated early stopping with Optuna MedianPruner",
            "Create reproducible automated tuning pipeline script executable via CLI flags"
        ],
        "tech_tags": ["Cross-Validation", "GridSearchCV", "RandomizedSearchCV", "Optuna", "Bayesian Optimization"],
        "resources": [
            {"title": "Optuna Hyperparameter Tuning Tutorial", "subtitle": "YouTube · 20 min · Modern MLOps", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=P6NwZVl8as8"},
            {"title": "Optuna Official Documentation", "subtitle": "Framework Docs · Quickstart", "icon": "fa-solid fa-sliders", "bg": "bg-blue-50 text-blue-600 border border-blue-100", "link": "https://optuna.org"}
        ],
        "expected_output": "An automated Optuna tuning study artifact finding optimal parameters with parameter importance charts."
    },
    {
        "day": 8,
        "phase": 2,
        "title": "Unsupervised Learning — Clustering & Dimensionality Reduction",
        "description": "Discover latent structures in unlabelled data. Apply K-Means, DBSCAN, and Hierarchical Clustering along with PCA and t-SNE for dimensionality reduction and high-dimensional visualization.",
        "beginner_reqs": [
            "Standardize features and train KMeans clustering model on customer/transaction data",
            "Determine optimal cluster count K using the Elbow Method (Inertia)",
            "Compute Silhouette Score to evaluate cluster separation quality",
            "Visualize 2D cluster assignments using Matplotlib scatter plots",
            "Interpret cluster profiles by calculating mean feature values per cluster"
        ],
        "inter_reqs": [
            "Implement Principal Component Analysis (PCA) to compress 15+ features into 2 principal components",
            "Plot Scree plot and explained variance ratio cumulative curves",
            "Train DBSCAN clustering to detect noise points and non-spherical clusters",
            "Compare KMeans vs DBSCAN performance on non-linearly separable data",
            "Apply t-SNE (t-Distributed Stochastic Neighbor Embedding) for 2D visualization"
        ],
        "advanced_reqs": [
            "Build customer segmentation engine combining UMAP dimensionality reduction and HDBSCAN clustering",
            "Implement automated cluster characterization generating business persona summaries",
            "Detect anomalies and fraudulent transactions using Isolation Forest and One-Class SVM",
            "Evaluate clustering stability using bootstrap resampling and Adjusted Rand Index (ARI)",
            "Package segmentation script with interactive 3D Plotly visualization"
        ],
        "tech_tags": ["K-Means", "DBSCAN", "PCA", "t-SNE", "UMAP", "Anomaly Detection"],
        "resources": [
            {"title": "PCA Step-by-Step with Clear Math", "subtitle": "YouTube · 21 min · StatQuest", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=FgakZw6K1QQ"},
            {"title": "Scikit-Learn Clustering Guide", "subtitle": "Official Docs · Visual Comparison", "icon": "fa-solid fa-shapes", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://scikit-learn.org/stable/modules/clustering.html"}
        ],
        "expected_output": "Interactive 2D/3D customer segmentation clusters with Elbow/Silhouette diagnostic curves and PCA variance plots."
    },
    {
        "day": 9,
        "phase": 2,
        "title": "Deep Learning Foundations with PyTorch",
        "description": "Enter the deep learning domain. Build Artificial Neural Networks from the ground up using PyTorch tensors, automatic differentiation (autograd), custom Datasets, and standard training loops.",
        "beginner_reqs": [
            "Install PyTorch and verify CUDA / CPU device availability",
            "Perform tensor operations (reshaping, matrix multiplication, indexing, GPU memory transfers)",
            "Demonstrate gradient computation with autograd (loss.backward() and tensor.grad)",
            "Build a 2-layer Multi-Layer Perceptron (MLP) using torch.nn.Sequential for digit classification",
            "Train for 5 epochs and compute training loss reduction"
        ],
        "inter_reqs": [
            "Define custom neural network class inheriting from torch.nn.Module",
            "Implement custom PyTorch Dataset and DataLoader with batching and shuffling",
            "Write clean modular training and validation loops with torch.no_grad() and model.eval()",
            "Experiment with activation functions (ReLU, LeakyReLU, GELU) and optimizers (SGD, AdamW)",
            "Plot training vs validation loss curves to diagnose overfitting"
        ],
        "advanced_reqs": [
            "Implement Learning Rate Scheduler (ReduceLROnPlateau / CosineAnnealingLR) and Early Stopping",
            "Apply Dropout (0.3) and Batch Normalization (BatchNorm1d) to stabilize training dynamics",
            "Log training metrics, loss curves, and weight histograms to TensorBoard / Weights & Biases",
            "Implement custom loss function (e.g. Focal Loss for class imbalance)",
            "Benchmark GPU vs CPU forward and backward pass latency across batch sizes"
        ],
        "tech_tags": ["PyTorch", "Deep Learning", "Tensors", "Autograd", "Neural Networks", "Backprop"],
        "resources": [
            {"title": "PyTorch for Deep Learning in 60 Minutes", "subtitle": "YouTube · 60 min · Official PyTorch", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=nbJ-2G2GvB4"},
            {"title": "PyTorch Official Tutorials & Documentation", "subtitle": "Official Docs · Code Examples", "icon": "fa-solid fa-fire", "bg": "bg-amber-50 text-amber-600 border border-amber-100", "link": "https://pytorch.org/tutorials/"}
        ],
        "expected_output": "A trained PyTorch MLP achieving > 96% test accuracy with modular dataset, dataloader, and learning rate scheduling."
    },
    {
        "day": 10,
        "phase": 2,
        "title": "Convolutional Neural Networks (CNNs) & Computer Vision",
        "description": "Process spatial and image datasets. Understand convolutional kernels, pooling layers, and transfer learning using state-of-the-art pretrained architectures like ResNet and MobileNet.",
        "beginner_reqs": [
            "Load CIFAR-10 or Fashion-MNIST using torchvision.datasets",
            "Apply torchvision.transforms (ToTensor, Normalize)",
            "Construct a 3-layer CNN (Conv2d -> ReLU -> MaxPool2d -> Flatten -> Linear)",
            "Train CNN for 5 epochs and measure accuracy vs a flat MLP model",
            "Display sample image predictions with true vs predicted labels"
        ],
        "inter_reqs": [
            "Implement data augmentation (RandomCrop, RandomHorizontalFlip, ColorJitter) to combat overfitting",
            "Perform Transfer Learning with pretrained ResNet-18 / MobileNetV2 from torchvision.models",
            "Freeze feature extractor layers and replace classification head with custom Linear layer",
            "Fine-tune top layers with differential learning rates for pretrained vs new weights",
            "Compute Confusion Matrix across all 10 image classes"
        ],
        "advanced_reqs": [
            "Implement Grad-CAM (Gradient-weighted Class Activation Mapping) to visualize image attention regions",
            "Train a custom vision model on an external Kaggle dataset (e.g. skin lesion / defect detection)",
            "Export trained model to TorchScript and ONNX for mobile/edge deployment",
            "Benchmark inference latency in FPS (frames per second) across batch sizes",
            "Write end-to-end image classification inference script taking raw image file path as input"
        ],
        "tech_tags": ["Computer Vision", "CNN", "PyTorch", "Torchvision", "ResNet", "Transfer Learning", "Grad-CAM"],
        "resources": [
            {"title": "CNNs Explained from Convolution to Backprop", "subtitle": "YouTube · 28 min · 3Blue1Brown style", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=KuXjwB4LzSA"},
            {"title": "Torchvision Models & Pretrained Weights", "subtitle": "PyTorch Vision Docs", "icon": "fa-solid fa-camera", "bg": "bg-blue-50 text-blue-600 border border-blue-100", "link": "https://pytorch.org/vision/stable/models.html"}
        ],
        "expected_output": "A fine-tuned ResNet model achieving > 88% accuracy on custom image dataset with Grad-CAM heatmaps."
    },
    {
        "day": 11,
        "phase": 3,
        "title": "Natural Language Processing (NLP) & Semantic Vector Embeddings",
        "description": "Process unstructured text data. Master tokenization, TF-IDF vectorization, N-grams, Word2Vec embeddings, and build sentiment classification and semantic search engines.",
        "beginner_reqs": [
            "Preprocess text: lowercasing, punctuation stripping, stopword removal, and lemmatization (spaCy/NLTK)",
            "Transform text corpus using Scikit-Learn TfidfVectorizer with unigrams and bigrams",
            "Train LogisticRegression and NaiveBayes classifiers on customer sentiment reviews",
            "Evaluate model performance with classification report and top positive/negative words",
            "Test sentiment predictions on custom user-provided text inputs"
        ],
        "inter_reqs": [
            "Train domain-specific Word2Vec embeddings using Gensim on a corpus of text documents",
            "Extract most similar words and test vector arithmetic (king - man + woman = queen)",
            "Generate sentence embeddings using TF-IDF weighted average word vectors",
            "Build semantic similarity search matching incoming queries against document repositories",
            "Perform topic modeling using Latent Dirichlet Allocation (LDA) to extract key themes"
        ],
        "advanced_reqs": [
            "Train a PyTorch Bi-directional LSTM with pretrained GloVe 100d embeddings for sequence classification",
            "Implement packed padded sequences (torch.nn.utils.rnn.pack_padded_sequence) for variable length texts",
            "Build attention mechanism over LSTM hidden states to visualize word importance weights",
            "Evaluate out-of-vocabulary handling and subword tokenization with Byte-Pair Encoding (BPE)",
            "Package text preprocessing pipeline into reusable Python package module"
        ],
        "tech_tags": ["NLP", "TF-IDF", "Word2Vec", "spaCy", "NLTK", "Bi-LSTM", "Gensim"],
        "resources": [
            {"title": "NLP from Zero to Hero — Text Processing & Embeddings", "subtitle": "YouTube · 40 min · Comprehensive", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=fNxaJsNG3-s"},
            {"title": "spaCy Industrial-Strength NLP Documentation", "subtitle": "Official Docs · Fast NLP", "icon": "fa-solid fa-font", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://spacy.io"}
        ],
        "expected_output": "A sentiment analysis & semantic document search engine with cosine similarity retrieval."
    },
    {
        "day": 12,
        "phase": 3,
        "title": "Transformers, Hugging Face & Pretrained LLMs",
        "description": "Enter the modern Transformer era. Understand Self-Attention, Multi-Head Attention, and fine-tune modern Transformer models (BERT, DistilBERT) using the Hugging Face ecosystem.",
        "beginner_reqs": [
            "Install Hugging Face transformers, datasets, and accelerate",
            "Utilize Hugging Face pipeline for Sentiment Analysis, Named Entity Recognition, and Summarization",
            "Load AutoTokenizer and AutoModelForSequenceClassification with pretrained weights (distilbert-base-uncased)",
            "Tokenize text sentences and examine input_ids, attention_mask, and token mappings",
            "Run inference on batch of text inputs and extract predicted probabilities"
        ],
        "inter_reqs": [
            "Fine-tune DistilBERT on a custom text classification dataset using Hugging Face Trainer API",
            "Configure TrainingArguments (learning rate, warmup steps, weight decay, evaluation strategy)",
            "Define compute_metrics function computing Accuracy and F1-score during evaluation steps",
            "Save fine-tuned weights and tokenizer to disk with save_pretrained()",
            "Load fine-tuned model back and evaluate against baseline TF-IDF model"
        ],
        "advanced_reqs": [
            "Build a mini Retrieval-Augmented Generation (RAG) system using sentence-transformers and Gemini / LLM API",
            "Chunk technical documentation into 256-token segments and generate 384-dimensional dense embeddings",
            "Index chunks into vector repository and retrieve top-k semantically relevant passages for incoming questions",
            "Construct grounded context prompt augmenting query and generate fact-checked answers",
            "Evaluate RAG retrieval precision and hallucination rates across diverse question types"
        ],
        "tech_tags": ["Transformers", "Hugging Face", "BERT", "DistilBERT", "RAG", "Embeddings", "LLMs"],
        "resources": [
            {"title": "Hugging Face Transformers Full Course", "subtitle": "YouTube · 50 min · Industry Standard", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=tiZFewofSLM"},
            {"title": "Hugging Face NLP Course Documentation", "subtitle": "Free Online Course & Code", "icon": "fa-solid fa-robot", "bg": "bg-purple-50 text-purple-600 border border-purple-100", "link": "https://huggingface.co/learn/nlp-course"}
        ],
        "expected_output": "A fine-tuned DistilBERT text classifier or mini RAG system with document chunking and vector retrieval."
    },
    {
        "day": 13,
        "phase": 3,
        "title": "Recommender Systems & Fast Vector Search (FAISS)",
        "description": "Build scalable recommendation and retrieval engines. Compare Collaborative Filtering and Content-Based filtering, and index 50,000+ vector embeddings using Facebook AI Similarity Search (FAISS).",
        "beginner_reqs": [
            "Build a Content-Based Recommender System using Cosine Similarity on MovieLens / Product features",
            "Calculate item similarity matrix based on genre, tag, and description embeddings",
            "Implement function recommend_items(item_id, top_n=5) returning highest scoring candidates",
            "Evaluate recommendations qualitatively and identify diversity limitations",
            "Document architecture and recommendation formula in README.md"
        ],
        "inter_reqs": [
            "Build Collaborative Filtering recommender using Matrix Factorization (TruncatedSVD / Surprise library)",
            "Predict missing user-item ratings and evaluate Root Mean Squared Error (RMSE) on test set",
            "Handle cold-start problem by falling back to top-rated / trending global items",
            "Index 10,000+ item embeddings into a FAISS FlatL2 and IndexIVFFlat index",
            "Benchmark nearest neighbor query latency comparing brute-force vs inverted file indexing"
        ],
        "advanced_reqs": [
            "Build a Two-Tower Deep Neural Network for candidate retrieval (User Tower + Item Tower in PyTorch)",
            "Export item embeddings into HNSW (Hierarchical Navigable Small World) FAISS index for sub-millisecond query time",
            "Implement two-stage recommendation pipeline (Retrieval -> Scoring / Re-ranking with XGBoost)",
            "Compute Mean Average Precision at K (MAP@K) and Normalized Discounted Cumulative Gain (NDCG@K)",
            "Build a REST API endpoint serving personalized recommendations with < 20ms response time"
        ],
        "tech_tags": ["Recommender Systems", "FAISS", "Vector Search", "Collaborative Filtering", "Matrix Factorization", "HNSW"],
        "resources": [
            {"title": "FAISS Fast Vector Search Tutorial in Python", "subtitle": "YouTube · 25 min · Modern Search", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=sKyvsdEv6rk"},
            {"title": "FAISS GitHub Repository & Wiki", "subtitle": "Meta Research Docs", "icon": "fa-brands fa-github", "bg": "bg-blue-50 text-blue-600 border border-blue-100", "link": "https://github.com/facebookresearch/faiss"}
        ],
        "expected_output": "A fast vector similarity search engine running on FAISS indexing 10,000+ items with < 5ms latency."
    },
    {
        "day": 14,
        "phase": 3,
        "title": "Model Packaging, Dockerization & Production REST API with FastAPI",
        "description": "Bridge the gap between model research and production software. Serialize models, build asynchronous inference microservices using FastAPI and Pydantic, and containerize the environment with Docker.",
        "beginner_reqs": [
            "Serialize trained ML pipeline (preprocessing + model) using joblib.dump()",
            "Create a FastAPI application with GET /health and POST /predict endpoints",
            "Define Pydantic input schema with strict type validation (e.g. numerical ranges, non-empty strings)",
            "Load model into memory on startup and return predictions with latency in milliseconds",
            "Test API interactively using auto-generated Swagger UI at /docs"
        ],
        "inter_reqs": [
            "Add POST /predict-batch endpoint processing multiple candidate records in a single request",
            "Implement structured JSON logging recording timestamp, input hashes, prediction, and latency",
            "Write comprehensive unit and integration tests using pytest and FastAPI TestClient",
            "Write a production Dockerfile with Python slim image and non-root user execution",
            "Build Docker image and test containerized API execution locally on port 8000"
        ],
        "advanced_reqs": [
            "Implement multi-stage Docker build minimizing final image size (< 300MB)",
            "Create docker-compose.yml configuration with volume mounts and environment variables",
            "Add Prometheus metrics exporter tracking request count, error rate, and p99 inference latency",
            "Implement background task queuing for heavy inference requests using Celery or async workers",
            "Setup GitHub Actions CI workflow running linting (flake8/black) and automated test suites on push"
        ],
        "tech_tags": ["FastAPI", "Pydantic", "Docker", "REST API", "MLOps", "Model Serving", "pytest"],
        "resources": [
            {"title": "Deploy Machine Learning Models with FastAPI & Docker", "subtitle": "YouTube · 45 min · Production Guide", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=h5wLuVDr0oc"},
            {"title": "FastAPI Official Documentation", "subtitle": "FastAPI Web Framework", "icon": "fa-solid fa-server", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://fastapi.tiangolo.com"}
        ],
        "expected_output": "A containerized FastAPI microservice with input validation, Swagger docs, health checks, and Dockerfile."
    },
    {
        "day": 15,
        "phase": 3,
        "title": "Capstone Project, Cloud Deployment & AI Portfolio Presentation",
        "description": "Synthesize your complete 15-day AI/ML journey. Build an end-to-end AI application, deploy it live to the cloud (Streamlit Cloud, Render, or Railway), configure CI/CD, and showcase your professional portfolio.",
        "beginner_reqs": [
            "Build an interactive Streamlit or Gradio web app connecting to your trained model",
            "Allow users to input custom parameters via sliders, dropdowns, or file uploads",
            "Display predicted outputs, confidence scores, and explanatory visual charts in real time",
            "Deploy application publicly to Streamlit Community Cloud or Render",
            "Write a professional README.md with problem statement, architecture diagram, and live demo link"
        ],
        "inter_reqs": [
            "Integrate SHAP / feature importance explanations directly into the web UI",
            "Implement batch CSV upload and downloadable prediction output reports",
            "Deploy backend FastAPI on Render / Railway and frontend UI separately",
            "Record a 3-minute video walkthrough demonstrating model usage and architectural design",
            "Publish clean GitHub repository following standard open-source conventions (.gitignore, LICENSE, requirements.txt)"
        ],
        "advanced_reqs": [
            "Setup complete GitHub Actions CI/CD pipeline deploying automatically on merge to main",
            "Implement automated data drift monitoring comparing incoming inference distribution against baseline",
            "Write a technical blog post or LinkedIn article detailing model engineering and engineering trade-offs",
            "Ensure full test coverage (> 80%) with automated pytest coverage badges",
            "Submit live public URL and repository link for final blockchain verification"
        ],
        "tech_tags": ["Capstone", "Streamlit", "Gradio", "Cloud Deployment", "CI/CD", "Portfolio", "MLOps"],
        "resources": [
            {"title": "Deploy Streamlit Apps for Free in 10 Minutes", "subtitle": "YouTube · 15 min · Step-by-Step", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://www.youtube.com/watch?v=2siBrMsqF44"},
            {"title": "Streamlit Documentation & Component Gallery", "subtitle": "Official Docs · UI Components", "icon": "fa-solid fa-globe", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://docs.streamlit.io"}
        ],
        "expected_output": "A live deployed web application with public URL, complete documentation, architecture diagram, and GitHub repo."
    }
]

def generate_day_markdown(task, level_name):
    reqs = task["beginner_reqs"] if level_name == "Beginner" else (task["inter_reqs"] if level_name == "Intermediate" else task["advanced_reqs"])
    reqs_md = "\n".join([f"- {r}" for r in reqs])
    
    md = f""":::task-hero
# Task {task["day"]} —
## {task["title"]} [{level_name} Track]
{task["description"]}
- Estimated: 3–4 hours
- Due: 11:59 PM Today
- Max 2 attempts
- Pass score: 60/100
:::

:::tip
### Day {task["day"]} Focus
Hamesha yaad rakhein: AI/ML engineering mein clean code, proper data validation aur reproducible experiments sabse zaroori hain. Make sure to commit clean Jupyter notebooks and scripts with clear documentation.
:::

## 🎯 Requirements

:::requirements
### {level_name.upper()} REQUIREMENTS
{reqs_md}
:::

## 💻 Starter Template

:::code python
### day{task["day"]}_{level_name.lower()}_starter.py
# CareerWizard AI / ML Engineering — Day {task["day"]}
# Track: {level_name} Level
import numpy as np
import pandas as pd

print("🚀 Starting Day {task['day']}: {task['title']}")

# TODO 1: Load and verify data
# TODO 2: Implement core algorithm / model logic
# TODO 3: Calculate metrics and evaluate outputs
# TODO 4: Save predictions and export artifacts

print("✅ Day {task['day']} pipeline executed successfully!")
:::

## 📊 AI Scoring & Evaluation Rubric

:::scoring
SCORE: Correctness & Logic|25|25
SCORE: Code Structure & Modularity|25|25
SCORE: Model Performance & Evaluation|25|25
SCORE: Documentation & Reproducibility|25|25
PASS: Minimum Pass Score|60|100
:::

## ✅ Pre-Submit Checklist

:::checklist
- Public GitHub repository with clean README.md
- All code runs without unhandled exceptions
- Model evaluation metrics clearly printed in console/notebook
- Requirements.txt and .gitignore properly configured
- No hardcoded API keys or secret credentials
:::

:::submit
:::
"""
    return md

def seed_aiml_data():
    db = SessionLocal()
    try:
        # 1. Ensure Track exists
        track = db.query(InternshipTrack).filter_by(track_key="aiml").first()
        if not track:
            track = InternshipTrack(
                id=uuid.uuid4(),
                track_key="aiml",
                name="AI / ML Engineering",
                description="Master Python, Pandas, Scikit-Learn, PyTorch, Deep Learning, NLP, and deploy production AI models.",
                icon="fa-brain",
                color_hex="#10b981",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(track)
            db.commit()
            db.refresh(track)
            print(f"Created InternshipTrack: {track.name}")
        else:
            track.name = "AI / ML Engineering"
            track.description = "Master Python, Pandas, Scikit-Learn, PyTorch, Deep Learning, NLP, and deploy production AI models."
            db.commit()
            print(f"Existing InternshipTrack: {track.name}")

        # Also ensure webdev track exists for reference if needed
        web_track = db.query(InternshipTrack).filter_by(track_key="webdev").first()
        if not web_track:
            web_track = InternshipTrack(
                id=uuid.uuid4(),
                track_key="webdev",
                name="Web Development",
                description="Full-stack web application development with modern frameworks.",
                icon="fa-code",
                color_hex="#3b82f6",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(web_track)
            db.commit()

        # 2. Ensure Plans exist
        plan15 = db.query(InternshipPlan).filter_by(plan_key="15day").first()
        if not plan15:
            plan15 = InternshipPlan(
                id=uuid.uuid4(),
                plan_key="15day",
                name="15-Day Internship",
                price=399,
                duration_days=15,
                total_tasks=15,
                is_course_only=False,
                features=["15 hands-on AI/ML tasks", "AI code review", "Verified certificate", "Own project option"],
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(plan15)
            db.commit()
            db.refresh(plan15)
            print(f"Created InternshipPlan: {plan15.name}")
        else:
            plan15.duration_days = 15
            plan15.total_tasks = 15
            db.commit()

        plan30 = db.query(InternshipPlan).filter_by(plan_key="30day").first()
        if not plan30:
            plan30 = InternshipPlan(
                id=uuid.uuid4(),
                plan_key="30day",
                name="30-Day Internship",
                price=599,
                duration_days=30,
                total_tasks=30,
                is_course_only=False,
                features=["30 phased project tasks", "AI + mentor review", "Blockchain certificate"],
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(plan30)
            db.commit()

        # 3. Seed 15 Internship Tasks
        for t_data in AI_ML_TASKS:
            existing_task = db.query(InternshipTask).filter_by(
                track_id=track.id,
                plan_duration=15,
                task_number=t_data["day"]
            ).first()

            if not existing_task:
                task = InternshipTask(
                    id=uuid.uuid4(),
                    track_id=track.id,
                    plan_duration=15,
                    task_number=t_data["day"],
                    phase=t_data["phase"],
                    title=t_data["title"],
                    description=t_data["description"],
                    beginner_reqs=t_data["beginner_reqs"],
                    inter_reqs=t_data["inter_reqs"],
                    advanced_reqs=t_data["advanced_reqs"],
                    tech_tags=t_data["tech_tags"],
                    resources=t_data["resources"],
                    expected_output=t_data["expected_output"],
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(task)
            else:
                existing_task.phase = t_data["phase"]
                existing_task.title = t_data["title"]
                existing_task.description = t_data["description"]
                existing_task.beginner_reqs = t_data["beginner_reqs"]
                existing_task.inter_reqs = t_data["inter_reqs"]
                existing_task.advanced_reqs = t_data["advanced_reqs"]
                existing_task.tech_tags = t_data["tech_tags"]
                existing_task.resources = t_data["resources"]
                existing_task.expected_output = t_data["expected_output"]
        
        db.commit()
        print(f"Seeded {len(AI_ML_TASKS)} tasks into internship_tasks table")

        # 4. Seed 15 DayContent entries for Admin and Learning portals
        # We seed for both task_name "AI / ML Engineering" and "AI/ML Bootcamp" so both work in UI
        for task_name_alias in ["AI / ML Engineering", "AI/ML Bootcamp"]:
            for t_data in AI_ML_TASKS:
                day_num = t_data["day"]
                existing_dc = db.query(DayContent).filter_by(
                    domain="aiml",
                    task_name=task_name_alias,
                    type="internship",
                    day=day_num
                ).first()

                beg_md = generate_day_markdown(t_data, "Beginner")
                int_md = generate_day_markdown(t_data, "Intermediate")
                adv_md = generate_day_markdown(t_data, "Advanced")

                beg_payload = [{"type": "task", "markdown": beg_md}]
                int_payload = [{"type": "task", "markdown": int_md}]
                adv_payload = [{"type": "task", "markdown": adv_md}]
                source_payload = t_data["resources"]

                if not existing_dc:
                    dc = DayContent(
                        id=uuid.uuid4(),
                        domain="aiml",
                        task_name=task_name_alias,
                        type="internship",
                        day=day_num,
                        beginner=beg_payload,
                        intermediate=int_payload,
                        advanced=adv_payload,
                        source=source_payload,
                        created_at=datetime.utcnow()
                    )
                    db.add(dc)
                else:
                    existing_dc.beginner = beg_payload
                    existing_dc.intermediate = int_payload
                    existing_dc.advanced = adv_payload
                    existing_dc.source = source_payload

        db.commit()
        print("Seeded 15 DayContent modules for both AI / ML Engineering and AI/ML Bootcamp")

        # 5. Ensure Enrollment for users (Het, etc.)
        users = db.query(User).all()
        for u in users:
            existing_enroll = db.query(Enrollment).filter_by(student_id=u.id, track_id=track.id).first()
            if not existing_enroll:
                # create dummy payment record if needed
                pay = db.query(Payment).filter_by(student_id=u.id).first()
                if not pay:
                    pay = Payment(
                        id=uuid.uuid4(),
                        student_id=u.id,
                        plan_id=plan15.id,
                        razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
                        razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}",
                        amount=39900,
                        status="paid",
                        created_at=datetime.utcnow()
                    )
                    db.add(pay)
                    db.commit()
                    db.refresh(pay)

                enroll = Enrollment(
                    id=uuid.uuid4(),
                    student_id=u.id,
                    plan_id=plan15.id,
                    track_id=track.id,
                    difficulty_level="intermediate",
                    status="active",
                    payment_id=pay.id,
                    current_day=6,
                    current_phase=2,
                    total_days=15,
                    avg_score=89.0,
                    streak_days=6,
                    started_at=datetime.utcnow() - timedelta(days=6),
                    deadline_at=datetime.utcnow() + timedelta(days=9),
                    created_at=datetime.utcnow() - timedelta(days=6)
                )
                db.add(enroll)
                db.commit()
                db.refresh(enroll)
                print(f"Created Enrollment for user: {u.email} (Day 6 / 15)")
            else:
                existing_enroll.total_days = 15
                existing_enroll.current_day = 6
                existing_enroll.current_phase = 2
                existing_enroll.avg_score = 89.0
                existing_enroll.streak_days = 6
                enroll = existing_enroll
                db.commit()

            # Seed task submissions for Days 1 to 5 for this enrollment
            tasks_1_5 = db.query(InternshipTask).filter(
                InternshipTask.track_id == track.id,
                InternshipTask.plan_duration == 15,
                InternshipTask.task_number <= 5
            ).order_by(InternshipTask.task_number.asc()).all()

            sub_scores = [92, 88, 91, 78, 94]
            for idx, t in enumerate(tasks_1_5):
                existing_sub = db.query(TaskSubmission).filter_by(
                    enrollment_id=enroll.id,
                    task_id=t.id
                ).first()
                score = sub_scores[idx]
                if not existing_sub:
                    sub = TaskSubmission(
                        id=uuid.uuid4(),
                        enrollment_id=enroll.id,
                        student_id=u.id,
                        task_id=t.id,
                        day_number=t.task_number,
                        github_url=f"https://github.com/hetpanchal/ai-ml-day{t.task_number}",
                        difficulty_chosen="intermediate",
                        submission_attempt=1,
                        status="passed",
                        ai_score_correctness=score - 2,
                        ai_score_approach=score,
                        ai_score_quality=score + 1,
                        ai_score_docs=score - 1,
                        total_score=score,
                        passed=True,
                        ai_feedback=f"Excellent implementation for Day {t.task_number}! Code demonstrates strong understanding of {', '.join(t.tech_tags[:2])}.",
                        improvements=["Add more comprehensive unit test assertions", "Profile memory usage under higher loads"],
                        highlight=f"Flawless execution of {t.title}",
                        submitted_at=datetime.utcnow() - timedelta(days=(6 - t.task_number))
                    )
                    db.add(sub)
            db.commit()

            # Seed a verified Certificate if not exists
            cert_uid = "CW-2025-AIML-00312" if "het" in u.email.lower() else f"CW-2025-AIML-{str(u.id)[:5].upper()}"
            cert = db.query(Certificate).filter_by(certificate_uid=cert_uid).first()
            if not cert:
                cert = Certificate(
                    id=uuid.uuid4(),
                    enrollment_id=enroll.id,
                    student_id=u.id,
                    certificate_uid=cert_uid,
                    type="Internship",
                    track_name="AI / ML Engineering",
                    plan_name="15-Day Internship",
                    final_score=89,
                    pdf_url="https://careerwizard.ai/certificates/CW-2025-AIML-00312.pdf",
                    qr_code_url="https://careerwizard.ai/verify/CW-2025-AIML-00312",
                    blockchain_hash="0x7f9a2b8c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
                    blockchain_tx="0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8",
                    is_verified=True,
                    issued_at=datetime.utcnow() - timedelta(days=1)
                )
                db.add(cert)
                db.commit()
                print(f"Created Certificate for user: {u.email}")

        print("AI / ML Internship Track successfully seeded with all 15 days!")
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_aiml_data()
