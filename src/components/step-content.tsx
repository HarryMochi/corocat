
import { marked } from 'marked';
import { useEffect, useState } from "react";
import { Loader2, BookOpen, Lightbulb, Code, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import type { ContentBlock } from '@/lib/types';

interface StepContentProps {
  contentBlocks?: ContentBlock[];
}

const blockConfig = {
    coreConcept: {
        icon: BookOpen,
        title: "Core Concept",
        style: "bg-background",
    },
    practicalExample: {
        icon: Code,
        title: "Practical Example",
        style: "bg-blue-50 dark:bg-blue-900/20",
    },
    analogy: {
        icon: Lightbulb,
        title: "Analogy",
        style: "bg-amber-50 dark:bg-amber-900/20",
    },
    keyTerm: {
        icon: KeyRound,
        title: "Key Term",
        style: "bg-green-50 dark:bg-green-900/20",
    },
};

function ContentBlockDisplay({ block }: { block: ContentBlock }) {
    const config = blockConfig[block.type] || blockConfig.coreConcept;
    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        if (block.content) {
            const parsedHtml = marked.parse(block.content, { breaks: true });
            setHtmlContent(parsedHtml as string);
        } else {
            setHtmlContent('');
        }
    }, [block.content]);

    return (
        <Card className={cn("overflow-hidden", config.style)}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                <config.icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-medium font-headline">{config.title}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div 
                    className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </CardContent>
        </Card>
    );
}

export function StepContent({ contentBlocks }: StepContentProps) {

  if (contentBlocks === undefined) {
    return (
      <div className="flex items-center justify-center space-x-2 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!contentBlocks || contentBlocks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        This step has no content.
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {contentBlocks.map((block, index) => (
            <ContentBlockDisplay key={index} block={block} />
        ))}
    </div>
  );
}
