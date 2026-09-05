import React from 'react';
import { BriefcaseIcon, CheckIcon } from './ui/Icons';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';

const SkillTag = ({ skill }) => {
  const { isDark } = React.useContext(ThemeContext);
  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1 text-[11px] font-semibold border mr-2 mb-2 transition-all duration-500 ${
      isDark 
        ? 'bg-white/[0.03] border-white/5 text-slate-400 hover:border-white/20 hover:text-white' 
        : 'bg-[var(--bg-main)] border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
    }`}>
      {skill}
    </span>
  );
};

const JobCard = ({ job }) => {
  const { isDark } = React.useContext(ThemeContext);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const description = job.description || "";
  const isLongDescription = description.length > 150;

  const getApplyUrl = () => {
    const rawLink = (job.apply_link || job.url || job.job_apply_link || "").trim();
    if (rawLink && rawLink !== '#' && (rawLink.startsWith('http://') || rawLink.startsWith('https://'))) {
      return rawLink;
    }
    
    const company = (job.company || "").trim();
    const title = (job.title || "").trim();
    const location = (job.location || "").trim();
    const companyLower = company.toLowerCase();
    const encodedTitle = encodeURIComponent(title || "Software Engineer");

    if (companyLower.includes("microsoft")) {
      return `https://careers.microsoft.com/us/en/search-results?q=${encodedTitle}`;
    }
    if (companyLower.includes("google")) {
      return `https://www.google.com/about/careers/applications/jobs/results/?q=${encodedTitle}`;
    }
    if (companyLower.includes("amazon")) {
      return `https://www.amazon.jobs/en/search?base_query=${encodedTitle}`;
    }
    if (companyLower.includes("meta") || companyLower.includes("facebook")) {
      return `https://www.metacareers.com/jobs?q=${encodedTitle}`;
    }
    if (companyLower.includes("apple")) {
      return `https://jobs.apple.com/en-us/search?search=${encodedTitle}`;
    }
    if (companyLower.includes("netflix")) {
      return `https://jobs.netflix.com/search?q=${encodedTitle}`;
    }
    if (companyLower.includes("stability")) {
      return `https://stability.ai/careers`;
    }
    if (companyLower.includes("openai")) {
      return `https://openai.com/careers/search?q=${encodedTitle}`;
    }
    if (companyLower.includes("flipkart")) {
      return `https://www.flipkartcareers.com/#!/searchjobs`;
    }
    if (companyLower.includes("zomato")) {
      return `https://www.zomato.com/careers`;
    }
    if (companyLower.includes("spotify")) {
      return `https://www.lifeatspotify.com/jobs?q=${encodedTitle}`;
    }
    if (companyLower.includes("stripe")) {
      return `https://stripe.com/jobs/search?query=${encodedTitle}`;
    }
    if (companyLower.includes("nvidia")) {
      return `https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=${encodedTitle}`;
    }
    if (companyLower.includes("salesforce")) {
      return `https://salesforce.wd1.myworkdayjobs.com/External_Career_Site?q=${encodedTitle}`;
    }
    if (companyLower.includes("adobe")) {
      return `https://careers.adobe.com/us/en/search-results?keywords=${encodedTitle}`;
    }

    const searchQuery = [title, company].filter(Boolean).join(" ");
    return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery || "Software Engineer")}${location ? `&location=${encodeURIComponent(location)}` : ''}`;
  };

  const applyUrl = getApplyUrl();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`group relative border rounded-2xl p-6 transition-all duration-700 hover:shadow-[0_8px_30px_rgba(160,120,64,0.08)] overflow-hidden ${
        isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.05)]'
      } ${
        isDark ? 'hover:border-white/20' : 'hover:border-slate-300'
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-[1px] bg-white/5 group-hover:bg-${isDark ? 'cyan-500' : 'emerald-500'}/20 transition-all duration-700`} />
      <div className={`absolute inset-0 bg-gradient-to-br from-${isDark ? 'cyan-500' : 'emerald-500'}/[0.015] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

      <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
        <div className={`w-16 h-16 rounded-xl shrink-0 border flex items-center justify-center transition-all duration-700 ${
          isDark 
            ? 'bg-white/[0.02] border-white/5 group-hover:border-cyan-500/20' 
            : 'bg-[var(--bg-main)] border-slate-200 group-hover:border-emerald-500/20'
        }`}>
          <BriefcaseIcon size={24} className={`transition-colors duration-700 ${
            isDark 
              ? 'text-slate-500 group-hover:text-cyan-400' 
              : 'text-slate-400 group-hover:text-emerald-600'
          }`} />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{job.title}</h3>
                {job.match !== null && (
                  <div className={`px-2.5 py-1 rounded-md border font-bold text-[14px] transition-all duration-700 shrink-0 ${
                    job.match >= 90 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 shadow-sm' 
                      : job.match >= 75 
                        ? 'bg-emerald-400/10 border-emerald-400/50 text-emerald-600' 
                        : 'bg-emerald-300/10 border-emerald-300/50 text-emerald-600'
                  }`}>
                    {job.match}% Match
                  </div>
                )}
              </div>
              <p className={`text-[14px] font-bold ${isDark ? 'text-cyan-400' : 'text-emerald-600'}`}>{job.company}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-[12px] font-medium text-[var(--text-muted)] opacity-80">
            <span className="flex items-center gap-2 transition-colors hover:text-[var(--text-main)]">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500/40' : 'bg-emerald-500/40'}`} /> {job.location}
            </span>
            <span className="flex items-center gap-2 transition-colors hover:text-[var(--text-main)]">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500/40' : 'bg-emerald-500/40'}`} /> {job.salary}
            </span>
            <span className="flex items-center gap-2 transition-colors hover:text-[var(--text-main)]">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500/40' : 'bg-emerald-500/40'}`} /> {job.type}
            </span>
          </div>

          <div className="relative group/desc">
            <p className={`text-[14px] text-[var(--text-main)] opacity-85 font-medium leading-relaxed max-w-4xl transition-all duration-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {description}
            </p>
            {isLongDescription && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-2 text-[11px] font-bold transition-colors duration-500 flex items-center ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-emerald-600 hover:text-emerald-500'
                }`}
              >
                {isExpanded ? 'Show Less [-]' : 'Read More [+]'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap pt-2">
            {(job.requiredSkills || []).map((skill, i) => <SkillTag key={i} skill={skill} />)}
          </div>
        </div>

        <a 
          href={applyUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!applyUrl || applyUrl === "#") {
              e.preventDefault();
              const fallback = `https://www.google.com/search?ibp=htl;jobs&q=${encodeURIComponent(`${job.title || ''} ${job.company || ''} jobs`)}`;
              window.open(fallback, '_blank', 'noopener,noreferrer');
            }
          }}
          className={`w-full lg:w-auto px-8 h-11 text-[14px] font-bold rounded-xl transition-all duration-700 shadow-md shrink-0 flex items-center justify-center decoration-0 no-underline cursor-pointer ${
            isDark
              ? 'bg-white text-black hover:bg-cyan-400 hover:shadow-[0_10px_25px_-5px_rgba(34,211,238,0.3)]'
              : 'bg-[#0f172a] text-white hover:bg-[#16a34a] hover:shadow-[0_10px_25px_-5px_rgba(22,163,74,0.3)]'
          }`}
        >
          Apply Now
        </a>
      </div>
    </motion.div>
  );
};

export default JobCard;
