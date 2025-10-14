
import MainLayout from "@/components/main-layout";
import Logo from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Button asChild variant="outline">
            <Link href="/learn">Back to App</Link>
          </Button>
        </header>
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <article className="prose dark:prose-invert max-w-none">
              <h1>Terms of Service</h1>
              <p className="lead">Last updated: July 10, 2024</p>

              <p>Welcome to Corocat! These terms and conditions outline the rules and regulations for the use of Corocat's Website, located at this domain.</p>

              <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Corocat if you do not agree to take all of the terms and conditions stated on this page.</p>

              <h2>1. License</h2>
              <p>Unless otherwise stated, Corocat and/or its licensors own the intellectual property rights for all material on Corocat. All intellectual property rights are reserved. You may access this from Corocat for your own personal use subjected to restrictions set in these terms and conditions.</p>
              
              <div>
                <p>You must not:</p>
                <ul>
                  <li>Republish material from Corocat</li>
                  <li>Sell, rent or sub-license material from Corocat</li>
                  <li>Reproduce, duplicate or copy material from Corocat</li>
                  <li>Redistribute content from Corocat</li>
                </ul>
              </div>

              <h2>2. User Content</h2>
              <p>In these terms and conditions, “your user content” means material (including without limitation text, images, audio material, video material and audio-visual material) that you submit to this website, for whatever purpose.</p>
              <p>You grant to Corocat a worldwide, irrevocable, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute your user content in any existing or future media. You also grant to Corocat the right to sub-license these rights, and the right to bring an action for infringement of these rights.</p>
              <p>Your user content must not be illegal or unlawful, must not infringe any third party's legal rights, and must not be capable of giving rise to legal action whether against you or Corocat or a third party (in each case under any applicable law).</p>

              <h2>3. No warranties</h2>
              <p>This Website is provided “as is,” with all faults, and Corocat expresses no representations or warranties, of any kind related to this Website or the materials contained on this Website. Also, nothing contained on this Website shall be interpreted as advising you.</p>

              <h2>4. Limitation of liability</h2>
              <p>In no event shall Corocat, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Corocat, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>

              <h2>5. Governing Law & Jurisdiction</h2>
              <p>These Terms will be governed by and interpreted in accordance with the laws of the State, and you submit to the non-exclusive jurisdiction of the state and federal courts located in for the resolution of any disputes.</p>
            </article>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
